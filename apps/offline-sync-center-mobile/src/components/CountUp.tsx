import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ 
  value, 
  duration = 0.7, 
  decimals = 0,
  prefix = '',
  suffix = ''
}) => {
  const [mounted, setMounted] = useState(false);
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });
  
  const displayValue = useTransform(springValue, (current) => {
    return prefix + current.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    setMounted(true);
    springValue.set(value);
  }, [value, springValue]);

  if (!mounted) {
    return <span>{prefix}0{decimals > 0 ? '.' + '0'.repeat(decimals) : ''}{suffix}</span>;
  }

  return <motion.span>{displayValue}</motion.span>;
};
