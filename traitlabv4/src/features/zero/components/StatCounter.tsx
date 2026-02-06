import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface StatCounterProps {
  value: string;
  label: string;
  duration?: number;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  label,
  duration = 2000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    const hasPlus = value.includes('+');
    const prefix = value.match(/^[^0-9]*/)?.[0] || '';
    const suffix = value.match(/[^0-9]*$/)?.[0] || '';

    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = Math.floor(numericValue * progress);
      const formatted = currentValue.toLocaleString();
      setDisplayValue(`${prefix}${formatted}${hasPlus ? '+' : ''}${suffix}`);

      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 bg-clip-text text-transparent mb-2 font-mono">
        {displayValue}
      </div>
      <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );
};
