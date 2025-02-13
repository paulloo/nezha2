export default {
  // 通道定义
  channels: {
    HEARTBEAT: 'heartbeat',
    DATA: 'data',
    ERROR: 'error',
    STATUS: 'status'
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
    CACHE_TTL: 10000, // 缓存有效期：10秒
    HEARTBEAT_INTERVAL: 30000, // 心跳间隔：30秒
    MAX_RECONNECT_ATTEMPTS: 5, // 最大重连次数
    RECONNECT_INTERVAL: 3000, // 重连间隔：3秒
    BATCH_INTERVAL: 100, // 批处理间隔：100ms
    METRICS_CLEANUP_INTERVAL: 300000 // 5分钟清理一次过期指标
  },

  // 批处理队列
  batchQueue: new Map(),
  
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
    }
  },

  // 发送消息
  sendMessage(ws, channel, data) {
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      const message = JSON.stringify({
        channel,
        data,
        timestamp: Date.now()
      });
      
      ws.send(message);
      this.updateMetrics(channel === this.channels.HEARTBEAT ? 'heartbeat' : 'data', 'sent');
    }
  },

  // 发送心跳
  sendHeartbeat(ws) {
    this.sendMessage(ws, this.channels.HEARTBEAT, {
      type: 'ping',
      metrics: {
        connections: this.websockets.size,
        cacheSize: this.cache.size,
        queueSize: this.batchQueue.size
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

  // 获取票房数据的函数
  async fetchBoxOfficeData(movieId) {
    const startTime = Date.now();
    try {
      this.updateMetrics('data', 'sent');
      
      const targetUrl = `https://piaofang.maoyan.com/dashboard-ajax/movie?movieId=${movieId}&orderType=0`;
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
          cacheEverything: true
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  // 主处理函数
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // WebSocket 升级请求处理
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      server.accept();
      this.websockets.add(server);
      this.updateMetrics('connection', 'total');
      this.updateMetrics('connection', 'active');
      
      let heartbeatInterval;
      let movieId;
      let reconnectAttempts = 0;
      
      // 处理WebSocket消息
      server.addEventListener("message", async ({ data }) => {
        try {
          const message = JSON.parse(data);
          
          // 处理不同类型的消息
          switch (message.type) {
            case 'init':
              movieId = message.movieId || '1294273';
              this.sendStatus(server, 'connected');
              break;
              
            case 'pong':
              this.updateMetrics('heartbeat', 'received');
              break;
              
            default:
              movieId = message.movieId || movieId || '1294273';
          }

          // 清除之前的心跳定时器
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          
          // 设置新的心跳定时器
          heartbeatInterval = setInterval(() => {
            this.sendHeartbeat(server);
          }, this.config.HEARTBEAT_INTERVAL);
          
          // 检查缓存
          const cached = this.cache.get(movieId);
          if (cached && Date.now() - cached.timestamp < this.config.CACHE_TTL) {
            this.updateMetrics('data', 'sent');
            this.sendMessage(server, this.channels.DATA, cached.data);
          } else {
            this.addToBatchQueue(movieId, server);
          }
        } catch (error) {
          console.error('消息处理错误:', error);
          this.sendError(server, error);
        }
      });
      
      // 错误处理
      server.addEventListener("error", (error) => {
        console.error('WebSocket错误:', error);
        this.updateMetrics('connection', 'errors');
        this.cleanup(server, heartbeatInterval);
      });
      
      // 关闭处理
      server.addEventListener("close", () => {
        this.updateMetrics('connection', 'active', -1);
        this.cleanup(server, heartbeatInterval);
      });
      
      // 定期清理性能指标
      const metricsCleanupInterval = setInterval(() => {
        this.cleanupMetrics();
      }, this.config.METRICS_CLEANUP_INTERVAL);
      
      ctx.waitUntil(new Promise((resolve) => {
        server.addEventListener('close', () => {
          clearInterval(metricsCleanupInterval);
          resolve();
        });
      }));
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    
    // 处理常规HTTP请求
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 处理性能指标请求
    if (url.pathname === '/metrics') {
      return new Response(JSON.stringify(this.metrics), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // 处理常规数据请求
    try {
      const movieId = url.searchParams.get('movieId') || '1294273';
      const cached = this.cache.get(movieId);
      
      if (cached && Date.now() - cached.timestamp < this.config.CACHE_TTL) {
        return new Response(JSON.stringify(cached.data), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
      
      const data = await this.fetchBoxOfficeData(movieId);
      this.cache.set(movieId, { data, timestamp: Date.now() });
      
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: '获取票房数据失败',
        message: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },

  // 清理函数
  cleanup(ws, heartbeatInterval) {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    this.websockets.delete(ws);
    
    // 从所有批处理队列中移除
    for (const [_, websockets] of this.batchQueue) {
      websockets.delete(ws);
    }
  }
};