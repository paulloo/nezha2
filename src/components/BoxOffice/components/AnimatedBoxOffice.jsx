import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

export const AnimatedBoxOffice = React.memo(({ value, subtitle, isToday }) => {
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
        className={`${isToday ? 'text-5xl md:text-6xl' : 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem]'} font-bold tracking-tight`}
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
}); 