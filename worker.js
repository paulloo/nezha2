export default {
  // 存储活跃的WebSocket连接
  websockets: new Set(),
  
  // 数据缓存
  cache: new Map(),
  
  // 获取票房数据的函数
  async fetchBoxOfficeData(movieId) {
    try {
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

      const response = await fetch(targetUrl, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return { error: '获取票房数据失败', message: error.message };
    }
  },

  // 定期更新数据并推送给所有连接的客户端
  async broadcastData(movieId, ws) {
    const data = await this.fetchBoxOfficeData(movieId);
    this.cache.set(movieId, { data, timestamp: Date.now() });
    
    // 如果WebSocket还在连接状态，发送数据
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      ws.send(JSON.stringify(data));
    }
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
      
      // 处理WebSocket消息
      server.addEventListener("message", async ({ data }) => {
        const movieId = data || '1294273'; // 默认哪吒2的ID
        
        // 首次连接，检查缓存
        const cached = this.cache.get(movieId);
        if (cached && Date.now() - cached.timestamp < 10000) { // 10秒内的缓存有效
          server.send(JSON.stringify(cached.data));
        } else {
          await this.broadcastData(movieId, server);
        }
        
        // 设置定时更新
        const interval = setInterval(async () => {
          await this.broadcastData(movieId, server);
        }, 10000); // 每10秒更新一次
        
        // 清理函数
        server.addEventListener("close", () => {
          clearInterval(interval);
          this.websockets.delete(server);
        });
        
        server.addEventListener("error", () => {
          clearInterval(interval);
          this.websockets.delete(server);
        });
      });
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    
    // 处理常规HTTP请求（作为备用方案）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const movieId = url.searchParams.get('movieId') || '1294273';
      
      // 检查缓存
      const cached = this.cache.get(movieId);
      if (cached && Date.now() - cached.timestamp < 10000) {
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
};