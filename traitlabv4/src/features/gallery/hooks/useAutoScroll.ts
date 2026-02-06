import { useEffect, useRef } from 'react';

interface UseAutoScrollOptions {
  isPlaying: boolean;
  velocity: number; // pixels per frame
  containerRef: React.RefObject<HTMLElement>;
  momentumDecay?: number; // 0-1, how quickly momentum decreases
}

export function useAutoScroll({
  isPlaying,
  velocity,
  containerRef,
  momentumDecay = 0.98,
}: UseAutoScrollOptions) {
  const animationFrameRef = useRef<number | null>(null);
  const currentVelocityRef = useRef(velocity);

  useEffect(() => {
    if (!isPlaying || !containerRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const container = containerRef.current;
    currentVelocityRef.current = velocity;

    const animate = () => {
      if (!container) return;

      // Apply momentum decay
      currentVelocityRef.current *= momentumDecay;

      // Stop if velocity is too small
      if (Math.abs(currentVelocityRef.current) < 0.01) {
        currentVelocityRef.current = 0;
        return;
      }

      // Scroll the container
      container.scrollTop += currentVelocityRef.current;

      // Loop back to top if we've reached the end
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.scrollTop = 0;
        currentVelocityRef.current = velocity; // Reset velocity
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, velocity, containerRef, momentumDecay]);
}
