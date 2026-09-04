import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const AmbientGlow: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const blurRadius = isMobile ? '70px' : '100px';
  const width = isMobile ? '80vw' : '65vw';

  return (
    <motion.div
      className="fixed top-[-10%] left-[50%] pointer-events-none z-0"
      style={{
        width,
        height: '40vh',
        background: 'radial-gradient(ellipse at center, var(--accent-amber) 0%, var(--accent-coral) 40%, transparent 70%)',
        filter: `blur(${blurRadius})`,
        opacity: 0.3,
        transform: 'translateX(-50%)',
        willChange: 'transform, opacity',
      }}
      animate={{
        scale: [0.95, 1.05],
        x: ['-53%', '-47%'],
      }}
      transition={{
        duration: 10,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    />
  );
};
