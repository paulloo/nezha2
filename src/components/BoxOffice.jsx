import { useState, useEffect } from 'react';
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

// 优化主组件
export default function BoxOffice({ movieId = '1294273' }) {
  const [rawData, setRawData] = useState(null);
  const processedData = useBoxOfficeData(rawData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = React.useRef(null);
  
  // 使用 useRef 存储最新的数据
  const boxOfficeDataRef = React.useRef(processedData);
  boxOfficeDataRef.current = processedData;

  const handleWebSocketMessage = React.useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      const movieData = {
        ...data?.movieList?.list?.[0],
        fontStyle: data.fontStyle,
        showCount: data?.movieList?.list?.[0]?.showCount || '0',
        viewCountDesc: data?.movieList?.nationBoxInfo?.viewCountDesc || '0',
        showCountDesc: data?.movieList?.nationBoxInfo?.showCountDesc || '0',
        sumBoxDesc: data?.movieList?.list?.[0]?.sumBoxDesc || '0万'
      };
      setRawData(movieData);
      setError(null);
    } catch (err) {
      console.error('数据处理错误:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const connectWebSocket = React.useCallback(() => {
    // 如果已经有连接且连接是开启状态，不要重新连接
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // 如果有旧连接，先关闭
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('wss://boxoffice.dongpoding.workers.dev');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      ws.send(movieId);
      setError(null);
      setLoading(false);
    };

    ws.onmessage = handleWebSocketMessage;

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      setError('连接发生错误');
      setLoading(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket连接已关闭，代码:', event.code);
      // 只有在非正常关闭时才重连
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(connectWebSocket, 3000);
      }
    };
  }, [movieId, handleWebSocketMessage]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, '组件卸载');
      }
    };
  }, [connectWebSocket]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/80 text-lg">正在获取实时数据...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-center text-white/80 p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
        <span className="text-4xl mb-4 block">😢</span>
        <p className="text-xl">{error}</p>
        <p className="text-sm mt-2 text-white/60">正在尝试重新连接...</p>
      </div>
    </div>
  );
  
  if (!processedData) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <p className="text-white/80 text-xl">暂无数据</p>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="h-full flex flex-col gap-6">
        {/* 头部信息 - 减小高度 */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-lg rounded-3xl p-4 border border-white/10">
          <div className="flex items-center gap-8">
            <div>
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
              >
                {rawData?.movieInfo?.movieName || '加载中...'}
              </motion.h1>
              <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  上映第 {(rawData?.movieInfo?.releaseInfo || '0').replace('上映', '').replace('天', '')} 天
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40"></span>
                <span>全国热映中</span>
              </div>
            </div>
            
            {/* 测试按钮 */}
            <motion.button
              onClick={triggerCelebration}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl border border-green-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              测试票房动画
            </motion.button>
          </div>
          
          <div className="text-right bg-white/5 rounded-xl p-2">
            <p className="text-xs text-white/60">实时数据更新</p>
            <p className="text-lg font-mono text-white/90 tabular-nums">
              {new Date().toLocaleTimeString()}
            </p>
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
                value={rawData?.showCount || '0'}
                subtitle={`排片占比：${rawData?.showCountRate || '0%'}`}
                icon="🎬"
                trend={parseFloat(rawData?.showCountRate) > 30 ? 'up' : 'down'}
              />
              <DataCard 
                title="今日场均人次" 
                value={rawData?.avgShowView || '0'}
                subtitle={`同档期第${rawData?.avgShowViewRank || '1'}名`}
                icon="👥"
                trend={parseInt(rawData?.avgShowViewRank) <= 2 ? 'up' : 'down'}
              />
              <DataCard 
                title="上座率" 
                value={rawData?.avgSeatView || '0%'}
                subtitle={`${rawData?.splitBoxRate || '0%'} 票房占比`}
                icon="🎫"
                trend={parseFloat(rawData?.splitBoxRate) > 30 ? 'up' : 'down'}
              />
              <DataCard 
                title="大盘贡献" 
                value={rawData?.boxRate || '0%'}
                subtitle="实时票房占比"
                icon="📊"
                trend={parseFloat(rawData?.boxRate) > 30 ? 'up' : 'down'}
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