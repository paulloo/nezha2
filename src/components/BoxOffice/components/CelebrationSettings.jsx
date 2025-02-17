import React from 'react';
import { motion } from 'framer-motion';
import { useCelebrationSettings } from '../hooks/useCelebrationSettings';

export const CelebrationSettings = () => {
  const { receiveCelebrations, setReceiveCelebrations } = useCelebrationSettings();

  return (
    <motion.div 
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setReceiveCelebrations(!receiveCelebrations)}
        className={`
          relative w-12 h-6 rounded-full transition-colors duration-200
          ${receiveCelebrations ? 'bg-green-500' : 'bg-gray-600'}
        `}
      >
        <motion.div
          className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5"
          animate={{ x: receiveCelebrations ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      <span className="text-sm text-white/60">
        {receiveCelebrations ? '接收庆祝通知' : '已关闭庆祝通知'}
      </span>
    </motion.div>
  );
}; 