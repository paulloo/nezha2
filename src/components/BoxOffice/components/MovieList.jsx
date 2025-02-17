import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { Portal } from './Portal';

export const MovieList = React.memo(({ movies, onMovieSelect, currentMovieId, onClose }) => {
  if (!movies?.length) return null;

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-hidden"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        {/* 背景遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 内容区域 */}
        <div className="relative h-full w-full max-w-7xl mx-auto px-4 py-6 overflow-y-auto">
          {/* 标题栏 */}
          <div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-black/80 backdrop-blur-sm -mx-4 px-4 py-4">
            <div>
              <h2 className="text-2xl font-bold text-white">实时票房榜</h2>
              <p className="text-white/60 text-sm mt-1">点击电影卡片查看详细数据</p>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-2xl">✕</span>
            </motion.button>
          </div>

          {/* 电影列表网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie, index) => (
              <motion.button
                key={movie.movieInfo.movieId}
                onClick={() => onMovieSelect(movie.movieInfo.movieId)}
                className={`
                  relative overflow-hidden rounded-2xl
                  ${movie.movieInfo.movieId === currentMovieId 
                    ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-black/90' 
                    : 'hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-black/90'
                  }
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 电影海报 */}
                <div className="relative aspect-[2/3]">
                  <img
                    src={movie.movieInfo.imgUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFhMWIxZSIvPjx0ZXh0IHg9IjQwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPuaaguaXoOWbvueJhzwvdGV4dD48L3N2Zz4='}
                    alt={movie.movieInfo.movieName}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={index < 6 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* 电影信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                    {movie.movieInfo.movieName}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{movie.movieInfo.releaseInfo}</span>
                    <div className="flex items-baseline gap-1">
                      <AnimatedNumber 
                        value={movie.sumBoxDesc} 
                        className="font-semibold text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 排名标记 */}
                {index < 3 && (
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className={`text-lg font-bold
                      ${index === 0 ? 'text-yellow-400' : 
                        index === 1 ? 'text-gray-300' : 
                        'text-yellow-600'}`}
                    >
                      {index + 1}
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </Portal>
  );
}); 