import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { decodeHtmlEntity, formatNumber, processBoxOfficeData, calculateSplitRate } from '../utils/maoyanDecoder';

// 修改图片导入方式
import nezha2Banner1 from '../assets/nezha2_banner.webp?url';
import nezha2Banner2 from '../assets/nezha2_banner2.jpg?url';
import nezha2Banner3 from '../assets/nezha2_banner3.jpg?url';

// 票房数据处理 Hook
const useBoxOfficeData = (data) => {
  return React.useMemo(() => {
    if (!data) {
      return {
        viewCountDesc: '0',
        viewCountUnit: '万张',
        showCountDesc: '0',
        showCountUnit: '万场',
        displayValue: '0万',
        splitDisplayValue: '0万',
        splitRate: 0,
        isDataValid: true
      };
    }

    try {
      // 解码票房数据
      const boxNum = data.boxSplitUnit?.num && data.fontStyle ? 
        decodeHtmlEntity(data.boxSplitUnit.num, data.fontStyle, 'boxOffice') : '0';
      const splitBoxNum = data.splitBoxSplitUnit?.num && data.fontStyle ? 
        decodeHtmlEntity(data.splitBoxSplitUnit.num, data.fontStyle, 'splitBoxOffice') : '0';

      // 数据有效性检查
      const isValidData = Boolean(
        data.boxSplitUnit?.num &&
        data.fontStyle &&
        boxNum !== '0' &&
        splitBoxNum !== '0'
      );

      // 格式化数据
      const formattedData = {
        viewCountDesc: data.viewCountDesc || '0',
        viewCountUnit: '万张',
        showCountDesc: data.showCountDesc || '0',
        showCountUnit: '万场',
        displayValue: data.sumBoxDesc || '0万',
        splitDisplayValue: data.sumSplitBoxDesc || '0万',
        splitRate: calculateSplitRate(splitBoxNum, boxNum, data.splitBoxRate),
        boxRate: data.boxRate || '0%',
        showCountRate: data.showCountRate || '0%',
        avgShowView: data.avgShowView || '0',
        avgShowViewRank: data.avgShowViewRank || '1',
        avgSeatView: data.avgSeatView || '0%',
        isDataValid: true
      };

      // 数据合理性检查
      const isReasonable = (
        parseFloat(formattedData.viewCountDesc) >= 0 &&
        parseFloat(formattedData.showCountDesc) >= 0 &&
        parseFloat(boxNum) >= 0 &&
        parseFloat(splitBoxNum) >= 0 &&
        formattedData.splitRate >= 0 &&
        formattedData.splitRate <= 100
      );

      if (!isReasonable) {
        console.warn('票房数据不合理，使用默认值');
        return {
          viewCountDesc: '0',
          viewCountUnit: '万张',
          showCountDesc: '0',
          showCountUnit: '万场',
          displayValue: '0万',
          splitDisplayValue: '0万',
          splitRate: 0,
          boxRate: '0%',
          showCountRate: '0%',
          avgShowView: '0',
          avgShowViewRank: '1',
          avgSeatView: '0%',
          isDataValid: true
        };
      }

      return formattedData;
    } catch (error) {
      console.error('票房数据处理错误:', error);
      return {
        viewCountDesc: data.viewCountDesc?.replace(/[^0-9.]/g, '') || '0',
        viewCountUnit: '万张',
        showCountDesc: data.showCountDesc?.replace(/[^0-9.]/g, '') || '0',
        showCountUnit: '万场',
        displayValue: data.sumBoxDesc || '0万',
        splitDisplayValue: data.sumSplitBoxDesc || '0万',
        splitRate: 0,
        boxRate: data.boxRate || '0%',
        showCountRate: data.showCountRate || '0%',
        avgShowView: data.avgShowView || '0',
        avgShowViewRank: data.avgShowViewRank || '1',
        avgSeatView: data.avgSeatView || '0%',
        isDataValid: true
      };
    }
  }, [data]);
};

// 优化数字动画组件
const AnimatedNumber = React.memo(({ value, className }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {value}
    </motion.span>
  );
}, (prevProps, nextProps) => prevProps.value === nextProps.value);

// 票房数字动画组件
const AnimatedBoxOffice = React.memo(({ value, subtitle, isToday }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsIncreasing(parseFloat(value) > parseFloat(prevValue));
      setPrevValue(value);
    }
  }, [value, prevValue]);

  return (
    <motion.div
      className={`flex flex-col items-center ${isIncreasing ? 'text-green-500' : 'text-orange-500'}`}
      initial={{ scale: 1 }}
      animate={{ 
        scale: [1, 1.1, 1],
        color: isIncreasing ? ['#f97316', '#22c55e', '#22c55e'] : ['#22c55e', '#f97316', '#f97316']
      }}
      transition={{ duration: 0.5 }}
    >
      <AnimatedNumber 
        value={value} 
        className={`${isToday ? 'text-5xl md:text-6xl' : 'text-6xl md:text-7xl lg:text-8xl'} font-bold tracking-tight`}
      />
      {subtitle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm mt-2 ${isIncreasing ? 'text-green-600' : 'text-orange-600'}`}
        >
          {subtitle}
        </motion.div>
      )}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.isToday === nextProps.isToday
  );
});

// 数据卡片组件
const DataCard = React.memo(({ title, value, subtitle, icon, trend }) => (
  <motion.div 
    className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-colors"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400 }}
  >
    <div className="flex items-center gap-3 mb-4">
      <span className="text-white/60">{icon}</span>
      <h3 className="text-lg text-white/80">{title}</h3>
    </div>
    <motion.div className="flex flex-col">
      <motion.p className="text-3xl lg:text-4xl font-semibold text-white">
        <AnimatedNumber value={value} />
      </motion.p>
      {subtitle && (
        <motion.p 
          className={`text-sm mt-1 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/60'}`}
        >
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{subtitle}
        </motion.p>
      )}
    </motion.div>
  </motion.div>
), (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.trend === nextProps.trend
  );
});

// 票房占比进度条组件
const BoxOfficeProgress = ({ value, total }) => {
  const percentage = (parseFloat(value) / parseFloat(total) * 100).toFixed(1);
  
  return (
    <div className="w-full mt-4">
      <div className="flex justify-between text-sm text-white/60 mb-2">
        <span>票房占比</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  );
};

// 优化电影轮播图组件
const MovieCarousel = React.memo(({ movieId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = React.useRef(null);
  const autoPlayRef = React.useRef(null);

  const images = [
    { url: nezha2Banner1, alt: "哪吒之破晓飞升" },
    { url: nezha2Banner2, alt: "哪吒之破晓飞升" },
    { url: nezha2Banner3, alt: "哪吒之破晓飞升" }
  ];

  // 自动播放
  useEffect(() => {
    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 5000);
    };

    const stopAutoPlay = () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };

    startAutoPlay();
    return () => stopAutoPlay();
  }, [images.length]);

  const handleDragStart = (event, info) => {
    setIsDragging(true);
    setDragStartX(info.point.x);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const dragDistance = info.point.x - dragStartX;
    const threshold = 50;

    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (dragDistance < 0 && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 5000);
    }
  };

  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-white/5 backdrop-blur-lg" ref={containerRef}>
      <div className="absolute inset-0 flex">
        {images.map((image, index) => (
          <motion.div
            key={index}
            className="relative w-full h-full flex-shrink-0"
            initial={false}
            animate={{
              x: `${-currentIndex * 100}%`,
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              left: `${index * 100}%`,
            }}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="absolute inset-0 w-full h-full object-cover select-none"
              draggable="false"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
          </motion.div>
        ))}
      </div>

      {/* 导航指示器 */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
        {images.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white w-6' 
                : 'bg-white/40 w-2 hover:bg-white/60'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`切换到第 ${index + 1} 张图片`}
          />
        ))}
      </div>
    </div>
  );
});

// 增强票房动画效果
const triggerCelebration = () => {
  // 多彩五彩纸屑
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
  
  // 从底部发射
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.9 },
    colors: colors,
  });

  // 从左侧发射
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
  }, 250);

  // 从右侧发射
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
  }, 400);

  // 从中间向四周爆发
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 360,
      startVelocity: 45,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      shapes: ['square', 'circle'],
    });
  }, 600);

  // 最后的烟花效果
  setTimeout(() => {
    const end = Date.now() + 1000;
    const colors = ['#ff0000', '#ffd700', '#00ff00', '#0000ff', '#ff00ff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, 800);
};

// 优化 WebSocket Hook
const useWebSocket = (movieId) => {
  // WebSocket 通道定义
  const channels = {
    HEARTBEAT: 'heartbeat',
    DATA: 'data',
    ERROR: 'error',
    STATUS: 'status'
  };

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastMessageTimeRef = useRef(Date.now());
  const [heartbeatStatus, setHeartbeatStatus] = useState('inactive');
  const [connectionMetrics, setConnectionMetrics] = useState({
    latency: 0,
    messageCount: 0,
    lastUpdate: null
  });

  // 配置
  const config = {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000,
    HEARTBEAT_TIMEOUT: 35000,
    METRICS_UPDATE_INTERVAL: 5000,
    INITIAL_RETRY_DELAY: 1000,
    MAX_RETRY_DELAY: 30000
  };

  // 消息处理器
  const messageHandlers = useMemo(() => ({
    [channels.HEARTBEAT]: (message) => {
      setHeartbeatStatus('active');
      lastMessageTimeRef.current = message.timestamp;
      // 更新连接指标
      if (message.data?.metrics) {
        setConnectionMetrics(prev => ({
          ...prev,
          ...message.data.metrics,
          lastUpdate: Date.now()
        }));
      }
      // 发送 pong 响应
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
      }
    },

    [channels.DATA]: (message) => {
      if (message.data?.movieList?.list?.[0]) {
        const movieData = {
          ...message.data.movieList.list[0],
          fontStyle: message.data.fontStyle,
          showCount: message.data.movieList.list[0].showCount || '0',
          viewCountDesc: message.data.movieList.nationBoxInfo?.viewCountDesc || '0',
          showCountDesc: message.data.movieList.nationBoxInfo?.showCountDesc || '0',
          sumBoxDesc: message.data.movieList.list[0].sumBoxDesc || '0万'
        };
        setData(movieData);
        setStatus('updated');
      }
    },

    [channels.ERROR]: (message) => {
      console.error('WebSocket错误:', message.data);
      setStatus('error');
    },

    [channels.STATUS]: (message) => {
      setStatus(message.data.status);
    }
  }), []);

  // 消息处理函数
  const handleMessage = useCallback((event) => {
    try {
      const { channel, data, timestamp } = JSON.parse(event.data);
      const handler = messageHandlers[channel];
      
      if (handler) {
        handler({ data, timestamp });
      } else {
        console.warn('未知的消息通道:', channel);
      }
    } catch (err) {
      console.error('消息处理错误:', err);
    }
  }, [messageHandlers]);

  // 计算下一次重试延迟
  const getNextRetryDelay = useCallback(() => {
    const baseDelay = config.INITIAL_RETRY_DELAY;
    const exponentialDelay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
    return Math.min(exponentialDelay, config.MAX_RETRY_DELAY);
  }, [config.INITIAL_RETRY_DELAY, config.MAX_RETRY_DELAY]);

  // 重连函数
  const reconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= config.MAX_RECONNECT_ATTEMPTS) {
      console.warn(`达到最大重连次数 (${config.MAX_RECONNECT_ATTEMPTS})`);
      setStatus('failed');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = getNextRetryDelay();
    console.log(`第 ${reconnectAttemptsRef.current + 1} 次重连，延迟 ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connectWebSocket();
    }, delay);
  }, [getNextRetryDelay]);

  // WebSocket 连接函数
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket 已连接');
        return;
      }

      if (wsRef.current?.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket 正在连接中');
        return;
      }

      // 清理现有连接
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      console.log('开始建立新的 WebSocket 连接');
      const ws = new WebSocket('wss://boxoffice.dongpoding.workers.dev');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket 连接成功');
        setStatus('connected');
        setHeartbeatStatus('active');
        reconnectAttemptsRef.current = 0;
        // 发送初始化消息
        ws.send(JSON.stringify({
          type: 'init',
          movieId,
          timestamp: Date.now()
        }));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket 连接错误:', error);
        setStatus('error');
        setHeartbeatStatus('inactive');
      };

      ws.onclose = (event) => {
        console.log(`WebSocket 连接关闭: ${event.code} ${event.reason}`);
        setStatus('disconnected');
        setHeartbeatStatus('inactive');
        
        // 只有在非正常关闭时才重连
        if (event.code !== 1000) {
          reconnect();
        }
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, "正常关闭");
        }
      };
    } catch (error) {
      console.error('WebSocket 连接异常:', error);
      setStatus('error');
      reconnect();
    }
  }, [movieId, handleMessage, reconnect]);

  // 心跳检查
  useEffect(() => {
    const heartbeatCheck = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
        if (timeSinceLastMessage > config.HEARTBEAT_TIMEOUT) {
          console.warn('心跳超时，准备重连');
          setHeartbeatStatus('timeout');
          if (wsRef.current) {
            wsRef.current.close(4000, "心跳超时");
          }
        }
      }
    }, config.HEARTBEAT_TIMEOUT);

    return () => clearInterval(heartbeatCheck);
  }, [config.HEARTBEAT_TIMEOUT]);

  // 初始连接
  useEffect(() => {
    console.log('初始化 WebSocket 连接');
    connectWebSocket();

    return () => {
      console.log('清理 WebSocket 连接');
      if (wsRef.current) {
        wsRef.current.close(1000, "组件卸载");
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  return {
    data,
    status,
    heartbeatStatus,
    connectionMetrics,
    connectionStatus: wsRef.current?.readyState
  };
};

// 添加状态提示组件
const ConnectionStatus = React.memo(({ status, error }) => {
  return (
    <AnimatePresence>
      {(status === 'disconnected' || status === 'error' || status === 'failed') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              {status === 'disconnected' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400">正在重新连接...</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">连接出现错误</span>
                </div>
              )}
              {status === 'failed' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">连接失败</span>
                  <motion.button
                    onClick={() => window.location.reload()}
                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    刷新页面
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// 优化主组件
export default function BoxOffice({ movieId = '1294273' }) {
  const { 
    data: rawData, 
    status, 
    heartbeatStatus,
    connectionMetrics,
    connectionStatus 
  } = useWebSocket(movieId);
  
  const processedData = useBoxOfficeData(rawData);
  const [error, setError] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const celebrationInterval = useRef(null);
  const prevDataRef = useRef(null);

  // 保存上一次的有效数据
  useEffect(() => {
    if (rawData && status === 'connected') {
      prevDataRef.current = rawData;
    }
  }, [rawData, status]);

  // 使用当前数据或上一次的有效数据
  const displayData = rawData || prevDataRef.current;
  const currentProcessedData = useBoxOfficeData(displayData);

  // 状态监听
  useEffect(() => {
    switch (status) {
      case 'connected':
        setError(null);
        break;
      case 'disconnected':
        setError('连接已断开');
        break;
      case 'error':
        setError('连接错误');
        break;
      case 'failed':
        setError('连接失败');
        break;
    }
  }, [status]);

  // 检查是否超过100亿并触发动画
  useEffect(() => {
    const boxOffice = parseFloat(processedData.displayValue);
    if (boxOffice >= 100 && !isCelebrating) {
      setIsCelebrating(true);
    }
  }, [processedData.displayValue]);

  // 控制持续动画
  useEffect(() => {
    if (isCelebrating) {
      celebrationInterval.current = setInterval(() => {
        triggerCelebration();
      }, 3000); // 每3秒触发一次
    } else if (celebrationInterval.current) {
      clearInterval(celebrationInterval.current);
      celebrationInterval.current = null;
    }

    return () => {
      if (celebrationInterval.current) {
        clearInterval(celebrationInterval.current);
      }
    };
  }, [isCelebrating]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (celebrationInterval.current) {
        clearInterval(celebrationInterval.current);
      }
    };
  }, []);

  // 停止动画的处理函数
  const handleStopCelebration = () => {
    setIsCelebrating(false);
  };

  // 渲染连接状态指示器
  const renderConnectionStatus = () => {
    const getStatusColor = () => {
      switch (heartbeatStatus) {
        case 'active':
          return 'bg-green-500';
        case 'timeout':
          return 'bg-red-500';
        default:
          return 'bg-yellow-500';
      }
    };

    return (
      <div className="flex items-center gap-2 text-white/60 text-sm">
        <span className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></span>
        <span>
          {connectionMetrics.lastUpdate ? 
            `${Math.floor((Date.now() - connectionMetrics.lastUpdate) / 1000)}秒前更新` : 
            '等待更新...'}
        </span>
        {status !== 'connected' && (
          <>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <span className="text-yellow-400">
              {status === 'disconnected' ? '正在重连...' : 
               status === 'error' ? '连接错误' : 
               status === 'failed' ? '连接失败' : ''}
            </span>
          </>
        )}
      </div>
    );
  };

  if (!displayData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/80 text-lg">正在获取实时数据...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <ConnectionStatus status={status} error={error} />
      <div className="h-full flex flex-col gap-6">
        {/* 头部信息 */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-lg rounded-3xl p-4 border border-white/10">
          <div className="flex items-center gap-8">
            <div>
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              >
                {displayData?.movieInfo?.movieName || '加载中...'}
              </motion.h1>
              <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                {renderConnectionStatus()}
                <span className="w-1 h-1 rounded-full bg-white/40"></span>
                <span>全国热映中</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              {/* 测试按钮 */}
              <motion.button
                onClick={triggerCelebration}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl border border-green-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                测试票房动画
              </motion.button>

              {/* 停止动画按钮 */}
              {isCelebrating && (
                <motion.button
                  onClick={handleStopCelebration}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  停止庆祝动画
                </motion.button>
              )}
            </div>
          </div>
          
          {/* 连接指标 */}
          <div className="text-right bg-white/5 rounded-xl p-2">
            <p className="text-xs text-white/60">连接状态</p>
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-white/90">
                活跃连接: {connectionMetrics.connections || 0}
              </p>
              <p className="text-white/90">
                缓存数量: {connectionMetrics.cacheSize || 0}
              </p>
            </div>
          </div>
        </div>

        {/* 主要内容区域 - 使用网格布局 */}
        <div className="flex-1 grid grid-cols-12 gap-6">
          {/* 左侧票房信息 */}
          <div className="col-span-8 grid grid-rows-[2fr,1fr] gap-6">
            {/* 总票房展示 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 flex flex-col justify-center items-center">
              <h2 className="text-white/60 text-xl mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                累计总票房
              </h2>
              <AnimatedBoxOffice 
                value={processedData.displayValue} 
                subtitle=""
                className="text-8xl lg:text-9xl bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
              />
              <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mt-8">
                <motion.div className="text-center p-4 rounded-2xl bg-white/5">
                  <p className="text-white/60 text-sm mb-2">总出票</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {processedData.viewCountDesc}
                    <span className="text-sm ml-1 text-white/60">{processedData.viewCountUnit}</span>
                  </p>
                </motion.div>
                <motion.div className="text-center p-4 rounded-2xl bg-white/5">
                  <p className="text-white/60 text-sm mb-2">总场次</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {processedData.showCountDesc}
                    <span className="text-sm ml-1 text-white/60">{processedData.showCountUnit}</span>
                  </p>
                </motion.div>
              </div>
            </div>

            {/* 详细数据指标 */}
            <div className="grid grid-cols-4 gap-4">
              <DataCard 
                title="今日排片场次" 
                value={displayData?.showCount || '0'}
                subtitle={`排片占比：${displayData?.showCountRate || '0%'}`}
                icon="🎬"
                trend={parseFloat(displayData?.showCountRate) > 30 ? 'up' : 'down'}
              />
              <DataCard 
                title="今日场均人次" 
                value={displayData?.avgShowView || '0'}
                subtitle={`同档期第${displayData?.avgShowViewRank || '1'}名`}
                icon="👥"
                trend={parseInt(displayData?.avgShowViewRank) <= 2 ? 'up' : 'down'}
              />
              <DataCard 
                title="上座率" 
                value={displayData?.avgSeatView || '0%'}
                subtitle={`${displayData?.splitBoxRate || '0%'} 票房占比`}
                icon="🎫"
                trend={parseFloat(displayData?.splitBoxRate) > 30 ? 'up' : 'down'}
              />
              <DataCard 
                title="大盘贡献" 
                value={displayData?.boxRate || '0%'}
                subtitle="实时票房占比"
                icon="📊"
                trend={parseFloat(displayData?.boxRate) > 30 ? 'up' : 'down'}
              />
            </div>
          </div>

          {/* 右侧轮播图 */}
          <div className="col-span-4">
            <MovieCarousel movieId={movieId} />
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center">
          <p className="text-white/40 text-xs flex items-center justify-center gap-2">
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            数据来源：猫眼电影
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            实时更新
          </p>
        </div>
      </div>
    </div>
  );
} 