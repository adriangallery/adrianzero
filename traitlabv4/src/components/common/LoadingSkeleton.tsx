/**
 * LoadingSkeleton Component
 * Shimmer loading placeholder
 */

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circle' | 'rect';
  count?: number;
}

export function LoadingSkeleton({ variant = 'rect', count = 1 }: LoadingSkeletonProps) {
  const getSkeletonClass = () => {
    switch (variant) {
      case 'card':
        return 'h-64 w-full rounded-lg';
      case 'text':
        return 'h-4 w-full rounded';
      case 'circle':
        return 'h-12 w-12 rounded-full';
      case 'rect':
      default:
        return 'h-32 w-full rounded-lg';
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`shimmer bg-muted ${getSkeletonClass()}`}
        />
      ))}
    </>
  );
}
