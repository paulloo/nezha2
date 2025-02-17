// src/components/BoxOffice/components/CelebrationButton.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CelebrationButton = React.memo(({ onCelebrate, disabled, cooldown }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.button
          onClick={onCelebrate}
          disabled={disabled}
          className={`
            relative z-10
            px-6 sm:px-8 py-2 sm:py-3
            rounded-full
            font-medium
            text-white
            shadow-lg
            backdrop-blur-sm
            transition-colors
            ${disabled 
              ? 'bg-white/10 cursor-not-allowed' 
              : 'bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 hover:from-pink-600 hover:via-purple-600 hover:to-violet-600'
            }
          `}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <span className="flex items-center gap-2 text-sm sm:text-base">
            {disabled ? (
              <>
                <span className="text-white/60">冷却中</span>
                <span className="text-xs sm:text-sm text-white/40">({cooldown}s)</span>
              </>
            ) : (
              <>
                <span>庆祝</span>
                <span className="text-lg sm:text-xl animate-bounce">🎉</span>
              </>
            )}
          </span>
        </motion.button>

        {/* 光晕效果 */}
        <AnimatePresence>
          {isHovered && !disabled && (
            <motion.div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-violet-500/30 rounded-full blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* 在线用户数量提示 - 在固定位置时隐藏 */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 whitespace-nowrap text-xs text-white/60 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm"
          >
            点击按钮与其他观众一起庆祝
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});