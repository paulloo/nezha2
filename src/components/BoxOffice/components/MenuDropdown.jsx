import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MovieConfig } from './MovieConfig';

export const MenuDropdown = React.memo(({ onMovieChange, currentMovieId, movieListData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMovieConfig, setShowMovieConfig] = useState(false);

  return (
    <div className="relative z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg">☰</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden z-50"
          >
            <motion.button
              onClick={() => {
                setShowMovieConfig(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/10 text-white/80 text-left"
              whileHover={{ x: 5 }}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-sm">切换电影</span>
            </motion.button>
            <motion.a
              href="https://github.com/paulloo/nezha2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 hover:bg-white/10 text-white/80 border-t border-white/10"
              whileHover={{ x: 5 }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm">GitHub</span>
            </motion.a>
            <div className="px-4 py-3 border-t border-white/10">
              <div className="text-xs text-white/60">
                数据来源：猫眼电影
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMovieConfig && (
          <MovieConfig
            currentMovieId={currentMovieId}
            onMovieChange={(id) => {
              onMovieChange(id);
              setShowMovieConfig(false);
            }}
            movieListData={movieListData}
            onClose={() => setShowMovieConfig(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}); 