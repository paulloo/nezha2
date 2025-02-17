import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

import { useBoxOfficeData } from './hooks/useBoxOfficeData';
import { useWebSocket } from './hooks/useWebSocket';
import { AnimatedBoxOffice } from './components/AnimatedBoxOffice';
import { DataCard } from './components/DataCard';
import { MovieCarousel } from './components/MovieCarousel';
import { MenuDropdown } from './components/MenuDropdown';
import { ConnectionStatus } from './components/ConnectionStatus';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CelebrationButton } from './components/CelebrationButton';
import { CelebrationSettings } from './components/CelebrationSettings';
import { CelebrationNotification } from './components/CelebrationNotification';
import { triggerCelebration } from './utils/celebrationEffects';

export default function BoxOffice({ initialMovieId = '1294273' }) {
  const [movieId, setMovieId] = useState(initialMovieId);
  const { 
    data: rawData, 
    movieListData,
    status, 
    heartbeatStatus,
    connectionMetrics,
    connectionStatus,
    sendCelebration,
    lastCelebration
  } = useWebSocket(movieId);
  
  const processedData = useBoxOfficeData(rawData);
  const [error, setError] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const celebrationInterval = useRef(null);
  const prevDataRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canCelebrate, setCanCelebrate] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  // 获取电影海报地址
  const moviePosterUrl = React.useMemo(() => {
    if (!rawData) return null;
    return rawData.movieInfo?.movieInfo?.imgUrl || rawData.movieInfo?.imgUrl || null;
  }, [rawData]);

  // 处理加载状态
  useEffect(() => {
    if (status === 'connected' && !rawData && !movieListData) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('数据加载超时，尝试重新连接');
        setError('数据加载超时');
        setIsLoading(false);
      }, 10000);
    }

    if ((status === 'connected' && movieListData) || rawData) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
      setError(null);
    }

    if (status === 'failed' || status === 'error') {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(false);
      setError(status === 'failed' ? '连接失败' : '连接错误');
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [status, rawData, movieListData, connectionStatus]);

  // 保存上一次的有效数据
  useEffect(() => {
    if (rawData && status === 'connected') {
      prevDataRef.current = rawData;
    }
  }, [rawData, status]);

  // 使用当前数据或上一次的有效数据
  const displayData = rawData || prevDataRef.current;
  const currentProcessedData = useBoxOfficeData(displayData);

  // 添加处理函数
  const handleCelebrate = useCallback(() => {
    if (!canCelebrate) return;
    
    // 触发庆祝效果
    triggerCelebration();
    
    // 发送 WebSocket 消息
    sendCelebration();
    
    // 设置冷却时间
    setCanCelebrate(false);
    setCooldown(10);
    
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanCelebrate(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [canCelebrate, sendCelebration]);

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <motion.div 
          className="text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-white/80 text-base sm:text-lg">正在获取实时数据...</p>
          {error && (
            <p className="text-red-400 mt-2 text-sm sm:text-base">{error}</p>
          )}
        </motion.div>
      </div>
    );
  }

  // 渲染错误状态
  if (error && !displayData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <motion.div 
          className="text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-red-400 text-base sm:text-lg mb-4">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm sm:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            重新加载
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-3 sm:p-4 md:p-6">
      <div className="h-full min-h-[calc(100vh-2.5rem)] flex flex-col gap-4 sm:gap-6 relative">
        {/* 头部信息区域 */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-3 sm:p-4 border border-white/10 relative z-40">
          <div className="flex items-center justify-between">
            <motion.h1 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent"
            >
              {displayData?.movieInfo?.movieName || '加载中...'}
            </motion.h1>
            <div className="flex items-center gap-4">
              <CelebrationSettings />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-colors group">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs sm:text-sm">
                  在线: {connectionMetrics.active}
                  <span className="text-white/40 text-xs ml-1 group-hover:inline hidden">
                    (总访问: {connectionMetrics.total})
                  </span>
                </span>
              </div>
              <MenuDropdown
                currentMovieId={movieId}
                onMovieChange={setMovieId}
                movieListData={movieListData}
              />
            </div>
          </div>
        </div>

        <ConnectionStatus status={status} error={error} />
        
        {/* 主要内容区域 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* 左侧票房信息 */}
          <div className="lg:col-span-8 grid grid-rows-[minmax(auto,1.5fr),1fr] gap-4 sm:gap-6">
            {/* 总票房展示 */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-4 sm:p-8 border border-white/10 flex flex-col justify-center items-center min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
              <h2 className="text-white/60 text-xl sm:text-2xl mb-4 sm:mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                累计总票房
              </h2>
              <div className="flex-1 flex items-center justify-center w-full">
                <AnimatedBoxOffice 
                  value={processedData.displayValue} 
                  subtitle=""
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 w-full max-w-2xl mt-6 sm:mt-8">
                <motion.div className="text-center p-3 sm:p-4 rounded-2xl bg-white/5">
                  <p className="text-white/60 text-xs sm:text-sm mb-2">总出票</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {processedData.viewCountDesc}
                    <span className="text-xs sm:text-sm ml-1 text-white/60">{processedData.viewCountUnit}</span>
                  </p>
                </motion.div>
                <motion.div className="text-center p-3 sm:p-4 rounded-2xl bg-white/5">
                  <p className="text-white/60 text-xs sm:text-sm mb-2">总场次</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {processedData.showCountDesc}
                    <span className="text-xs sm:text-sm ml-1 text-white/60">{processedData.showCountUnit}</span>
                  </p>
                </motion.div>
              </div>
            </div>

            {/* 详细数据指标 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="lg:col-span-4 h-[300px] sm:h-[400px] lg:h-auto">
            <MovieCarousel 
              movieId={movieId} 
              movieName={displayData?.movieInfo?.movieName}
              imgUrl={moviePosterUrl} 
            />
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

      {/* 添加庆祝通知 */}
      <CelebrationNotification 
        lastCelebration={lastCelebration}
        movieName={displayData?.movieInfo?.movieName}
      />

      {/* 添加固定位置的庆祝按钮 */}
      <motion.div 
        className="fixed bottom-6 right-6 z-[9999]"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <CelebrationButton
          onCelebrate={handleCelebrate}
          disabled={!canCelebrate}
          cooldown={cooldown}
        />
      </motion.div>
    </div>
  );
} 