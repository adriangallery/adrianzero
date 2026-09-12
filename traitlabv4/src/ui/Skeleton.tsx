import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Placeholder de carga sobre el panel del sistema F3 (respeta prefers-reduced-motion vía .skeleton). */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-testid="ui-skeleton"
      className={cn('skeleton rounded-[var(--r-md)]', className)}
      {...props}
    />
  );
}
