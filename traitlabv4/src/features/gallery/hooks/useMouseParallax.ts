import { useCallback, type RefObject } from 'react';

interface ParallaxHandlers {
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: () => void;
}

const MAX_ROTATION_DEG = 12; // Maximum rotation in degrees

export function useMouseParallax(
  cardRef: RefObject<HTMLDivElement | null>
): ParallaxHandlers | Record<string, never> {
  // Disable parallax on touch devices for better performance
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate normalized position (-1 to 1)
      const normalizedX = (e.clientX - centerX) / (rect.width / 2);
      const normalizedY = (e.clientY - centerY) / (rect.height / 2);

      // Calculate rotation angles (inverted Y for natural effect)
      const rotateX = normalizedY * -MAX_ROTATION_DEG;
      const rotateY = normalizedX * MAX_ROTATION_DEG;

      // Apply transform with GPU acceleration
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    },
    [cardRef]
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    // Reset to neutral position with smooth transition
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  }, [cardRef]);

  // Return empty object on touch devices to disable parallax
  if (isTouchDevice) {
    return {};
  }

  return { handleMouseMove, handleMouseLeave };
}
