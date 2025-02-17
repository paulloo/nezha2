export default {
  // 通道定义
  channels: {
    HEARTBEAT: 'heartbeat',
    DATA: 'data',
    ERROR: 'error',
    STATUS: 'status',
    CELEBRATION: 'celebration'  // 添加庆祝消息通道
  },

  // 存储活跃的WebSocket连接
  websockets: new Set(),
  
  // 数据缓存
  cache: new Map(),
  
  // 性能监控数据
  metrics: {
    heartbeat: {
      sent: 0,
      received: 0,
      timeouts: 0,
      lastPing: null
    },
    data: {
      sent: 0,
      received: 0,
      errors: 0,
      avgProcessTime: 0,
      lastProcessTime: null
    },
    connection: {
      total: 0,
      active: 0,
      errors: 0,
      reconnects: 0
    }
  },

  // 配置
  config: {
    CACHE_TTL: parseInt(process.env.CACHE_TTL) || 10000, // 缓存有效期：10秒
    HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL) || 30000, // 心跳间隔：30秒
    MAX_RECONNECT_ATTEMPTS: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 5, // 最大重连次数
    RECONNECT_INTERVAL: parseInt(process.env.RECONNECT_INTERVAL) || 3000, // 重连间隔：3秒
    BATCH_INTERVAL: parseInt(process.env.BATCH_INTERVAL) || 100, // 批处理间隔：100ms
    METRICS_CLEANUP_INTERVAL: parseInt(process.env.METRICS_CLEANUP_INTERVAL) || 300000, // 5分钟清理一次过期指标
    RATE_LIMIT: {
      MAX_REQUESTS_PER_IP: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_IP) || 100, // 每个IP每分钟最大请求数
      MAX_CONNECTIONS_PER_IP: parseInt(process.env.RATE_LIMIT_MAX_CONNECTIONS_PER_IP) || 5, // 每个IP最大WebSocket连接数
      MAX_TOTAL_CONNECTIONS: parseInt(process.env.RATE_LIMIT_MAX_TOTAL_CONNECTIONS) || 10000, // 全局最大WebSocket连接数
      CELEBRATION_COOLDOWN: parseInt(process.env.RATE_LIMIT_CELEBRATION_COOLDOWN) || 10000, // 庆祝消息冷却时间(ms)
      BROADCAST_BATCH_SIZE: parseInt(process.env.RATE_LIMIT_BROADCAST_BATCH_SIZE) || 1000, // 广播消息批处理大小
      BROADCAST_INTERVAL: parseInt(process.env.RATE_LIMIT_BROADCAST_INTERVAL) || 100 // 广播消息间隔(ms)
    },
    CACHE_CONFIG: {
      MAX_ITEMS: parseInt(process.env.CACHE_MAX_ITEMS) || 1000, // 最大缓存项数
      CLEANUP_INTERVAL: parseInt(process.env.CACHE_CLEANUP_INTERVAL) || 60000, // 缓存清理间隔(ms)
    },
    API: {
      BASE_URL: process.env.MAOYAN_API_BASE_URL || 'https://piaofang.maoyan.com',
      DEFAULT_MOVIE_ID: process.env.MAOYAN_DEFAULT_MOVIE_ID || '1294273'
    }
  },

  // 批处理队列
  batchQueue: new Map(),
  
  // IP请求计数器
  ipRequestCounts: new Map(),
  ipConnectionCounts: new Map(),
  celebrationTimestamps: new Map(),

  // 更新性能指标
  updateMetrics(type, action, value = 1) {
    if (this.metrics[type]) {
      if (typeof this.metrics[type][action] === 'number') {
        this.metrics[type][action] += value;
      }
      
      // 记录时间戳
      if (action === 'sent' || action === 'received') {
        this.metrics[type].lastProcessTime = Date.now();
      }

      // 更新连接数
      if (type === 'connection') {
        this.broadcast({
          channel: 'status',
          data: {
            status: 'metrics',
            connections: this.websockets.size,
            metrics: this.metrics.connection
          }
        });
      }
    }
  },

  // 广播消息给所有客户端
  async broadcast(message) {
    const serializedMessage = JSON.stringify(message);
    let activeConnections = 0;
    const connections = Array.from(this.websockets);
    const batchSize = this.config.RATE_LIMIT.BROADCAST_BATCH_SIZE;
    
    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize);
      await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT.BROADCAST_INTERVAL));
      
      for (const ws of batch) {
        if (ws.readyState === WebSocket.READY_STATE_OPEN) {
          try {
            ws.send(serializedMessage);
            activeConnections++;
          } catch (error) {
            console.error('广播消息发送失败:', error);
            this.websockets.delete(ws);
          }
        } else {
          this.websockets.delete(ws);
        }
      }
    }

    this.metrics.connection.active = activeConnections;
  },

  // 发送消息
  sendMessage(ws, channel, data) {
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      const message = {
        channel,
        data,
        timestamp: Date.now()
      };
      
      try {
        ws.send(JSON.stringify(message));
        console.log('消息发送成功:', { channel, data });
      } catch (error) {
        console.error('消息发送失败:', error);
      }
    }
  },

  // 发送心跳
  sendHeartbeat(ws) {
    this.sendMessage(ws, this.channels.HEARTBEAT, {
      type: 'ping',
      metrics: {
        connections: this.websockets.size,
        active: this.metrics.connection.active,
        total: this.metrics.connection.total,
        timestamp: Date.now()
      }
    });
  },

  // 发送错误消息
  sendError(ws, error) {
    this.sendMessage(ws, this.channels.ERROR, {
      message: error.message,
      code: error.code || 500,
      timestamp: Date.now()
    });
    this.updateMetrics('data', 'errors');
  },

  // 发送状态更新
  sendStatus(ws, status) {
    this.sendMessage(ws, this.channels.STATUS, {
      status,
      timestamp: Date.now()
    });
  },

  // 广播庆祝消息给所有连接的客户端
  broadcastCelebration(movieId, sourceWs) {
    console.log('开始广播庆祝消息:', {
      movieId,
      totalConnections: this.websockets.size
    });

    const message = {
      channel: this.channels.CELEBRATION,
      data: {
        movieId,
        timestamp: Date.now()
      }
    };

    // 广播给所有其他客户端
    this.websockets.forEach(ws => {
      if (ws !== sourceWs && ws.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('广播消息发送失败:', error);
        }
      }
    });
  },

  // 获取票房数据的函数
  async fetchBoxOfficeData(movieId) {
    const cacheKey = `movie_${movieId}`;
    const now = Date.now();
    const cachedData = this.cache.get(cacheKey);

    // 检查缓存
    if (cachedData && (now - cachedData.timestamp) < this.config.CACHE_TTL) {
      return cachedData.data;
    }

    const startTime = Date.now();
    try {
      this.updateMetrics('data', 'sent');
      
      const targetUrl = `${this.config.API.BASE_URL}/dashboard-ajax/movie?movieId=${movieId}&orderType=0`;
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://piaofang.maoyan.com/dashboard/movie',
        'Origin': 'https://piaofang.maoyan.com',
        'Host': 'piaofang.maoyan.com',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      };

      const response = await fetch(targetUrl, { 
        headers,
        cf: {
          cacheTtl: 5,
          cacheEverything: true,
          minify: true,
          polish: true,
          mirage: true
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 更新缓存
      this.cache.set(cacheKey, {
        data,
        timestamp: now
      });
      
      // 计算处理时间
      const processTime = Date.now() - startTime;
      this.updateMetrics('data', 'avgProcessTime', processTime);
      
      return data;
    } catch (error) {
      this.updateMetrics('data', 'errors');
      return { error: '获取票房数据失败', message: error.message };
    }
  },

  // 批量处理数据更新
  async processBatch(movieId) {
    if (!this.batchQueue.has(movieId)) {
      return;
    }

    const websockets = this.batchQueue.get(movieId);
    this.batchQueue.delete(movieId);

    if (websockets.size === 0) {
      return;
    }

    const data = await this.fetchBoxOfficeData(movieId);
    this.cache.set(movieId, { data, timestamp: Date.now() });

    // 批量发送数据
    for (const ws of websockets) {
      if (ws.readyState === WebSocket.READY_STATE_OPEN) {
        this.sendMessage(ws, this.channels.DATA, data);
      }
    }
  },

  // 添加到批处理队列
  addToBatchQueue(movieId, ws) {
    if (!this.batchQueue.has(movieId)) {
      this.batchQueue.set(movieId, new Set());
      // 延迟处理批次
      setTimeout(() => this.processBatch(movieId), this.config.BATCH_INTERVAL);
    }
    this.batchQueue.get(movieId).add(ws);
  },

  // 清理过期的性能指标
  cleanupMetrics() {
    const now = Date.now();
    const expireTime = now - this.config.METRICS_CLEANUP_INTERVAL;

    // 清理过期的时间戳
    for (const type of ['heartbeat', 'data']) {
      if (this.metrics[type].lastProcessTime < expireTime) {
        this.metrics[type].lastProcessTime = null;
      }
    }

    // 重置计数器
    this.metrics.connection.errors = 0;
    this.metrics.connection.reconnects = 0;
  },

  // 添加限流检查方法
  checkRateLimit(ip) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    
    if (!this.ipRequestCounts.has(ip)) {
      this.ipRequestCounts.set(ip, new Map());
    }
    
    const counts = this.ipRequestCounts.get(ip);
    const currentCount = counts.get(minute) || 0;
    
    if (currentCount >= this.config.RATE_LIMIT.MAX_REQUESTS_PER_IP) {
      return false;
    }
    
    counts.set(minute, currentCount + 1);
    
    // 清理旧的计数
    for (const [key] of counts) {
      if (key < minute - 1) {
        counts.delete(key);
      }
    }
    
    return true;
  },

  // 检查WebSocket连接限制
  checkConnectionLimit(ip) {
    const connectionCount = this.ipConnectionCounts.get(ip) || 0;
    return connectionCount < this.config.RATE_LIMIT.MAX_CONNECTIONS_PER_IP &&
           this.websockets.size < this.config.RATE_LIMIT.MAX_TOTAL_CONNECTIONS;
  },

  // 主处理函数
  async fetch(request, env, ctx) {
    const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip');
    const url = new URL(request.url);
    
    // WebSocket 升级请求处理
    if (request.headers.get('Upgrade') === 'websocket') {
      // 检查IP限流
      if (!this.checkRateLimit(clientIP)) {
        return new Response('连接频率超限', { status: 429 });
      }

      // 检查连接数限制
      if (!this.checkConnectionLimit(clientIP)) {
        return new Response('连接数超出限制', { status: 429 });
      }

      try {
        // 创建 WebSocket 对
        const [client, server] = Object.values(new WebSocketPair());

        // 配置 WebSocket
        server.accept();

        // 设置初始状态
        const connectionInfo = {
          ip: clientIP,
          userAgent: request.headers.get('User-Agent'),
          timestamp: Date.now(),
          lastActivity: Date.now()
        };

        // 处理新连接
        this.handleNewConnection(server, request, connectionInfo);

        // 返回客户端 WebSocket
        return new Response(null, {
          status: 101,
          webSocket: client,
          headers: {
            'Sec-WebSocket-Protocol': request.headers.get('Sec-WebSocket-Protocol') || ''
          }
        });
      } catch (error) {
        console.error('WebSocket 升级失败:', error);
        return new Response('WebSocket 升级失败', { status: 500 });
      }
    }

    // 处理普通 HTTP 请求
    // ... 其余的 HTTP 请求处理代码 ...
  },

  // 优化的 WebSocket 连接处理
  handleNewConnection(ws, request, connectionInfo) {
    try {
      // 更新连接计数
      this.ipConnectionCounts.set(connectionInfo.ip, 
        (this.ipConnectionCounts.get(connectionInfo.ip) || 0) + 1
      );
      
      // 添加到活跃连接集合
      this.websockets.add(ws);
      
      // 更新指标
      this.updateMetrics('connection', 'total');
      this.updateMetrics('connection', 'active');

      // 发送欢迎消息
      this.sendMessage(ws, this.channels.STATUS, {
        status: 'connected',
        message: '连接成功',
        timestamp: Date.now()
      });

      // 设置心跳检测
      let heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.READY_STATE_OPEN) {
          this.sendHeartbeat(ws);
        } else {
          clearInterval(heartbeatInterval);
        }
      }, this.config.HEARTBEAT_INTERVAL);

      // 处理消息
      ws.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // 更新最后活动时间
          connectionInfo.lastActivity = Date.now();

          // 处理不同类型的消息
          switch (message.type) {
            case 'init':
              if (message.movieId) {
                this.addToBatchQueue(message.movieId, ws);
              }
              break;
            case 'celebration':
              if (message.movieId) {
                this.broadcastCelebration(message.movieId, ws);
              }
              break;
            case 'pong':
              // 处理心跳响应
              this.updateMetrics('heartbeat', 'received');
              break;
          }
        } catch (error) {
          console.error('消息处理错误:', error);
          this.sendError(ws, error);
        }
      });

      // 处理错误
      ws.addEventListener('error', (error) => {
        console.error('WebSocket错误:', error);
        this.updateMetrics('connection', 'errors');
        this.cleanup(ws, heartbeatInterval);
      });

      // 处理关闭
      ws.addEventListener('close', () => {
        this.cleanup(ws, heartbeatInterval);
        
        // 更新IP连接计数
        const currentCount = this.ipConnectionCounts.get(connectionInfo.ip);
        if (currentCount > 1) {
          this.ipConnectionCounts.set(connectionInfo.ip, currentCount - 1);
        } else {
          this.ipConnectionCounts.delete(connectionInfo.ip);
        }
      });

    } catch (error) {
      console.error('连接处理错误:', error);
      ws.close(1011, '服务器内部错误');
    }
  },

  // 优化的清理函数
  cleanup(ws, heartbeatInterval) {
    try {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      this.websockets.delete(ws);
      this.updateMetrics('connection', 'active', -1);
      
      // 从所有批处理队列中移除
      for (const [_, websockets] of this.batchQueue) {
        websockets.delete(ws);
      }
      
      // 如果连接还开着，关闭它
      if (ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.close(1000, "正常关闭");
      }
    } catch (error) {
      console.error('清理错误:', error);
    }
  }
};