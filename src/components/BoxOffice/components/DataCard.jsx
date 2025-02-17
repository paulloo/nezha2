import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

export const DataCard = React.memo(({ title, value, subtitle, icon, trend }) => (
  <motion.div 
    className="bg-white/5 backdrop-blur-lg p-3 sm:p-4 rounded-2xl border border-white/20 hover:border-white/40 transition-colors"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400 }}
  >
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
      <span className="text-white/60">{icon}</span>
      <h3 className="text-sm sm:text-base text-white/80">{title}</h3>
    </div>
    <motion.div className="flex flex-col">
      <motion.p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
        <AnimatedNumber value={value} />
      </motion.p>
      {subtitle && (
        <motion.p 
          className={`text-xs sm:text-sm mt-1 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/60'}`}
        >
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{subtitle}
        </motion.p>
      )}
    </motion.div>
  </motion.div>
)); 