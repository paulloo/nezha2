import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

export const MovieCarousel = React.memo(({ movieId, movieName, imgUrl }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = useRef(null);
  const autoPlayRef = useRef(null);

  // 默认占位图片
  const defaultImage = {
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWIxZSIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuaaguaXoOWbvueJhzwvdGV4dD48L3N2Zz4=',
    alt: movieName || '暂无图片'
  };

  // 根据 movieId 和 imgUrl 决定使用哪些图片
  const images = useMemo(() => {
    if (imgUrl) {
      return [{ url: imgUrl, alt: movieName || '电影海报' }];
    } else {
      return [defaultImage];
    }
  }, [imgUrl, movieId, movieName]);

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