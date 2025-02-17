import { useState, useEffect, useRef, useCallback } from 'react';
import { useCelebrationSettings } from './useCelebrationSettings';
import { ref, onValue, push, serverTimestamp, onDisconnect, set, increment } from 'firebase/database';
import { db } from '../../../config/firebase';

// WebSocket 通道定义
const channels = {
  HEARTBEAT: 'heartbeat',
  DATA: 'data',
  ERROR: 'error',
  STATUS: 'status'
};

export const useWebSocket = (movieId) => {
  const { receiveCelebrations } = useCelebrationSettings();
  const [data, setData] = useState(null);
  const [movieListData, setMovieListData] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [lastCelebration, setLastCelebration] = useState(null);
  const [activeConnections, setActiveConnections] = useState(0);
  const wsRef = useRef(null);
  const dataRef = useRef(null);
  const currentMovieIdRef = useRef(movieId);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  const [connectionMetrics, setConnectionMetrics] = useState({
    active: 0,
    total: 0,
    wsConnections: 0,
    firebaseConnections: 0,
    lastUpdate: Date.now()
  });

  // 跟踪活跃连接
  useEffect(() => {
    // 创建一个唯一的连接ID
    const connectionId = Math.random().toString(36).substr(2, 9);
    const connectionsRef = ref(db, 'connections');
    const myConnectionRef = ref(db, `connections/${connectionId}`);

    // 添加连接
    const updateConnection = () => {
      const sessionId = (() => {
        let id = sessionStorage.getItem('box_office_session_id');
        if (!id) {
          id = Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('box_office_session_id', id);
        }
        return id;
      })();

      set(myConnectionRef, {
        timestamp: serverTimestamp(),
        movieId: currentMovieIdRef.current,
        lastActive: serverTimestamp(),
        sessionId,
        source: 'web',
        userAgent: window.navigator.userAgent,
        language: window.navigator.language
      });
    };

    // 初始化连接
    updateConnection();

    // 设置定期更新在线状态
    const heartbeatInterval = setInterval(updateConnection, 30000); // 每30秒更新一次

    // 监听总连接数
    const connectionsListener = onValue(connectionsRef, (snapshot) => {
      const connections = snapshot.val();
      if (connections) {
        // 获取当前时间戳
        const now = Date.now();
        // 获取所有独立会话
        const uniqueSessions = new Set();
        
        Object.values(connections).forEach(conn => {
          // 只统计2分钟内活跃的连接
          if (conn.lastActive && (now - new Date(conn.lastActive).getTime()) < 120000) {
            uniqueSessions.add(conn.sessionId);
          }
        });

        // 更新在线人数为独立会话数
        setConnectionMetrics(prev => ({
          ...prev,
          firebaseConnections: uniqueSessions.size,
          lastUpdate: now
        }));
      } else {
        setConnectionMetrics(prev => ({
          ...prev,
          firebaseConnections: 0,
          lastUpdate: Date.now()
        }));
      }
    });

    // 页面关闭或隐藏时，更新状态
    const handleVisibilityChange = () => {
      if (document.hidden) {
        set(myConnectionRef, null).catch(console.error);
      } else {
        updateConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理函数
    return () => {
      clearInterval(heartbeatInterval);
      connectionsListener();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 移除连接
      set(myConnectionRef, null).catch(console.error);
    };
  }, []);

  // 监听庆祝事件 (Firebase)
  useEffect(() => {
    if (!movieId) return;

    const celebrationRef = ref(db, `celebrations/${movieId}`);
    
    const unsubscribe = onValue(celebrationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lastEvent = Object.values(data).pop();
        console.log('收到庆祝消息:', lastEvent);

        if (receiveCelebrations) {
          setLastCelebration(lastEvent);
          import('../utils/celebrationEffects').then(module => {
            module.triggerCelebration();
          }).catch(error => {
            console.error('加载庆祝效果模块失败:', error);
          });
        }
      }
    });

    return () => unsubscribe();
  }, [movieId, receiveCelebrations]);

  // 重连函数
  const reconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('达到最大重连次数');
      setStatus('failed');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`第 ${reconnectAttemptsRef.current + 1} 次重连尝试`);
      reconnectAttemptsRef.current += 1;
      connectWebSocket();
    }, RECONNECT_DELAY);
  }, []);

  // 消息处理函数
  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);
      const { channel, data } = message;

      switch (channel) {
        case channels.HEARTBEAT:
          if (data.metrics) {
            setConnectionMetrics(prev => ({
              ...prev,
              wsConnections: data.metrics.active || 0,
              lastUpdate: data.metrics.timestamp
            }));
          }
          break;
        case channels.STATUS:
          if (data.status === 'metrics') {
            setConnectionMetrics(prev => ({
              ...prev,
              wsConnections: data.connections || 0,
              total: data.metrics?.total || prev.total,
              lastUpdate: Date.now()
            }));
          }
          setStatus(data.status);
          break;
        case channels.DATA:
          if (data?.movieList) {
            setMovieListData(data.movieList);
            const movieData = data.movieList.list.find(movie => 
              String(movie.movieInfo?.movieId) === String(currentMovieIdRef.current)
            );
            
            if (movieData) {
              // 处理数据，确保包含所有必要字段
              const processedData = {
                ...movieData,
                viewCountDesc: data.movieList.nationBoxInfo?.viewCountDesc || '0',
                viewCountUnit: '万张',
                showCountDesc: data.movieList.nationBoxInfo?.showCountDesc || '0',
                showCountUnit: '万场',
                sumBoxDesc: movieData.sumBoxDesc || '0万',
                movieInfo: {
                  movieName: movieData.movieInfo?.movieName,
                  movieId: movieData.movieInfo?.movieId,
                  releaseInfo: movieData.movieInfo?.releaseInfo,
                  imgUrl: movieData.movieImg || movieData.movieInfo?.imgUrl,
                  ...data.movieInfo
                }
              };
              
              dataRef.current = processedData;
              setData(processedData);
            }
          }
          break;

        case channels.ERROR:
          console.error('WebSocket错误:', data);
          setStatus('error');
          break;
      }
    } catch (err) {
      console.error('消息处理错误:', err);
    }
  }, []);

  // 发送初始化消息
  const sendInitMessage = useCallback((id) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送初始化消息');
      return;
    }
    
    const message = {
      type: 'init',
      movieId: id,
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  // WebSocket 连接函数
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendInitMessage(currentMovieIdRef.current);
        return;
      }

      const ws = new WebSocket('wss://boxoffice.dongpoding.workers.dev');
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        sendInitMessage(currentMovieIdRef.current);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        setStatus('error');
        reconnect();
      };

      ws.onclose = () => {
        setStatus('disconnected');
        reconnect();
      };
    } catch (error) {
      console.error('WebSocket连接异常:', error);
      setStatus('error');
      reconnect();
    }
  }, [handleMessage, sendInitMessage, reconnect]);

  // 更新 currentMovieIdRef 和发送初始化消息
  useEffect(() => {
    if (movieId) {
      currentMovieIdRef.current = movieId;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendInitMessage(movieId);
      }
    }
  }, [movieId, sendInitMessage]);

  // 初始连接
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "组件卸载");
      }
    };
  }, [connectWebSocket]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "组件卸载");
      }
    };
  }, []);

  // 发送庆祝消息 (Firebase)
  const sendCelebration = () => {
    if (!movieId) return;
    
    const celebrationRef = ref(db, `celebrations/${movieId}`);
    push(celebrationRef, {
      movieId,
      timestamp: serverTimestamp()
    });
  };

  // 计算活跃连接总数
  useEffect(() => {
    setConnectionMetrics(prev => ({
      ...prev,
      active: Math.max(prev.wsConnections, prev.firebaseConnections)
    }));
  }, [connectionMetrics.wsConnections, connectionMetrics.firebaseConnections]);

  return {
    data: data || dataRef.current,
    movieListData,
    status,
    lastCelebration,
    sendCelebration,
    connectionMetrics
  };
}; 