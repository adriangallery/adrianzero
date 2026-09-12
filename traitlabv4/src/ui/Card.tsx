import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Panel base del sistema F3: borde 2px #2f353e, radio 14, fondo panel. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-testid="ui-card"
      className={cn('rounded-[var(--r-lg)] border-2 border-line bg-panel', className)}
      {...props}
    />
  );
});
