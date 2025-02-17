import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const CelebrationNotification = ({ lastCelebration, movieName }) => {
  if (!lastCelebration) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={lastCelebration.timestamp}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-24 right-6 z-[9998] px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg shadow-lg"
      >
        <div className="text-white/80 text-sm">
          <span className="text-lg mr-2">🎉</span>
          有观众正在为《{movieName}》庆祝
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 