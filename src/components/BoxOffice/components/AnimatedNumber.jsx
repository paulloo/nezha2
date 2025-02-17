import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const AnimatedNumber = React.memo(({ 
  value, 
  className = '',
  duration = 0.5,
  delay = 0,
  precision = 2  // 添加精度参数
}) => {
  // 确保 value 是字符串类型
  const stringValue = String(value);
  
  // 将字符串值转换为数字
  const numericValue = parseFloat(stringValue.replace(/[^0-9.-]/g, '')) || 0;
  const unit = stringValue.replace(/[0-9.-]/g, '');
  
  // 使用 useSpring 创建平滑动画
  const springValue = useSpring(numericValue, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
    delay: delay * 1000
  });

  // 格式化数字
  const formattedValue = useTransform(springValue, (latest) => {
    // 检查是否为整数
    if (Number.isInteger(numericValue)) {
      return Math.round(latest).toLocaleString('zh-CN');
    }
    
    // 使用 Intl.NumberFormat 进行格式化，保留指定位数的小数
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: true
    }).format(latest);
  });

  // 使用 ref 跟踪上一个值
  const prevValueRef = useRef(numericValue);

  // 当值变化时更新动画
  useEffect(() => {
    prevValueRef.current = numericValue;
    springValue.set(numericValue);
  }, [numericValue, springValue]);

  return (
    <motion.span className={className}>
      <motion.span>{formattedValue}</motion.span>
      {unit && <span>{unit}</span>}
    </motion.span>
  );
});

// 添加一个更复杂的版本，支持更多自定义选项
export const AnimatedNumberAdvanced = React.memo(({
  value,
  className = '',
  duration = 0.5,
  delay = 0,
  formatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    notation: 'standard',
    useGrouping: true
  },
  animationConfig = {
    stiffness: 100,
    damping: 30,
    type: 'spring'
  },
  prefix = '',
  suffix = '',
  shouldAnimateOnMount = true
}) => {
  const numericValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
  const springValue = useSpring(shouldAnimateOnMount ? 0 : numericValue, {
    ...animationConfig,
    duration: duration * 1000,
    delay: delay * 1000
  });

  const formattedValue = useTransform(springValue, (latest) => {
    try {
      return new Intl.NumberFormat('zh-CN', formatOptions).format(latest);
    } catch (error) {
      console.error('数字格式化错误:', error);
      return latest.toFixed(formatOptions.maximumFractionDigits);
    }
  });

  useEffect(() => {
    springValue.set(numericValue);
  }, [numericValue, springValue]);

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span>{formattedValue}</motion.span>
      {suffix}
    </motion.span>
  );
}); 