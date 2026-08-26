import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RotatingTextProps {
  texts: string[];
  rotationInterval?: number;
  className?: string;
  elementLevelClassName?: string;
}

export const RotatingText: React.FC<RotatingTextProps> = ({
  texts,
  rotationInterval = 2500,
  className = '',
  elementLevelClassName = '',
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [texts, rotationInterval]);

  return (
    <span className={`inline-flex overflow-hidden relative h-[1.3em] items-center ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentTextIndex}
          initial={{ y: '100%', opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-100%', opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${elementLevelClassName}`}
        >
          {texts[currentTextIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
