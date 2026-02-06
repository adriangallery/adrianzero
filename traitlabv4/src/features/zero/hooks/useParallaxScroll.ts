import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface ParallaxScrollOptions {
  speed?: number; // Multiplier for scroll speed (0.5 = half speed, 2 = double speed)
  offset?: [number, number]; // Custom scroll range [start, end]
}

export const useParallaxScroll = (
  options: ParallaxScrollOptions = {}
): { ref: React.RefObject<HTMLDivElement | null>; y: MotionValue<number> } => {
  const { speed = 0.5, offset } = options;
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset || ['start end', 'end start'],
  });

  const defaultRange = speed > 0 ? [0, -200 * speed] : [0, 200 * Math.abs(speed)];
  const y = useTransform(scrollYProgress, [0, 1], defaultRange);

  return { ref, y };
};

export const useParallaxScrollMultiple = (
  count: number,
  baseSpeed: number = 0.5
): Array<{ ref: React.RefObject<HTMLDivElement | null>; y: MotionValue<number> }> => {
  return Array.from({ length: count }, (_, i) => {
    const speed = baseSpeed * (i + 1);
    return useParallaxScroll({ speed });
  });
};
