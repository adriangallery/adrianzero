import { useEffect, useRef, useMemo } from 'react';
import type { GalleryNFT } from '../types/gallery.types';

interface UseInfiniteScrollOptions {
  rootMargin?: string;
  threshold?: number;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

const DEFAULT_OPTIONS: UseInfiniteScrollOptions = {
  rootMargin: isMobile ? '800px 0px' : '1500px 3000px',
  threshold: 0.01,
};

export function useInfiniteScroll(
  items: GalleryNFT[],
  options: UseInfiniteScrollOptions = DEFAULT_OPTIONS
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Circular buffer: clone first 30 items to the end for seamless infinite scroll
  const extendedItems = useMemo(() => {
    if (items.length === 0) return [];
    const cloneCount = Math.min(30, items.length);
    return [...items, ...items.slice(0, cloneCount)];
  }, [items]);

  useEffect(() => {
    // Create Intersection Observer for lazy loading images
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;

            // Load image if it has a data-src attribute
            if (img.dataset.src && !img.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }

            // Optionally unobserve after loading
            observerRef.current?.unobserve(img);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: options.rootMargin || DEFAULT_OPTIONS.rootMargin,
        threshold: options.threshold || DEFAULT_OPTIONS.threshold,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [options.rootMargin, options.threshold]);

  const observeElement = (element: HTMLElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  };

  return {
    extendedItems,
    observeElement,
  };
}
