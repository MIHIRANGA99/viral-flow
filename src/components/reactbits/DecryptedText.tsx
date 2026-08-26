import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover' | 'mount';
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = true,
  revealDirection = 'start',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-amber-500/70 opacity-80',
  animateOn = 'mount',
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const intervalRef = useRef<any>(null);

  const getNextIndex = (revealedSet: Set<number>) => {
    const textLength = text.length;
    switch (revealDirection) {
      case 'start':
        return revealedSet.size;
      case 'end':
        return textLength - 1 - revealedSet.size;
      case 'center': {
        const middle = Math.floor(textLength / 2);
        const offset = Math.floor(revealedSet.size / 2);
        const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset;
        return (nextIndex >= 0 && nextIndex < textLength) ? nextIndex : revealedSet.size;
      }
      default:
        return revealedSet.size;
    }
  };

  const startScramble = () => {
    let currentIteration = 0;
    const newRevealedIndices = new Set<number>();
    setRevealedIndices(newRevealedIndices);
    setIsScrambling(true);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        if (sequential) {
          if (newRevealedIndices.size < text.length) {
            const nextIndex = getNextIndex(newRevealedIndices);
            newRevealedIndices.add(nextIndex);
            setRevealedIndices(new Set(newRevealedIndices));
          } else {
            clearInterval(intervalRef.current);
            setIsScrambling(false);
            return text;
          }
        } else {
          currentIteration++;
          if (currentIteration >= maxIterations) {
            clearInterval(intervalRef.current);
            setIsScrambling(false);
            return text;
          }
        }

        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (newRevealedIndices.has(index)) return text[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('');
      });
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'mount') {
      startScramble();
    }
    return () => clearInterval(intervalRef.current);
  }, [text]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover' || isHovering) {
      setIsHovering(true);
      startScramble();
    }
  };

  return (
    <span
      className={`inline-block whitespace-pre-wrap cursor-default ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
    >
      <span className={className}>
        {displayText.split('').map((char, index) => {
          const isRevealed = revealedIndices.has(index) || !isScrambling;
          return (
            <span
              key={index}
              className={isRevealed ? className : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
};
