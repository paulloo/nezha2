import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConnectionStatus = React.memo(({ status, error }) => {
  return (
    <AnimatePresence>
      {(status === 'disconnected' || status === 'error' || status === 'failed') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[60]"
        >
          <div className="bg-gray-900/95 backdrop-blur-lg rounded-lg border border-white/20 p-3 sm:p-4 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              {status === 'disconnected' && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 text-xs sm:text-sm">正在重新连接...</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 text-xs sm:text-sm">连接出现错误</span>
                </div>
              )}
              {status === 'failed' && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 text-xs sm:text-sm">连接失败</span>
                  <motion.button
                    onClick={() => window.location.reload()}
                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs sm:text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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