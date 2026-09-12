import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Contador opcional mostrado tras el texto, p.ej. "Pelo · 12" */
  count?: number;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, count, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      data-testid="ui-chip"
      aria-pressed={selected}
      className={cn(
        'flex-none whitespace-nowrap rounded-full px-3.5 py-2.5 text-[13px] transition-colors',
        selected
          ? 'bg-acc text-acc-fg font-bold'
          : 'border-2 border-line text-fg hover:border-mute',
        className
      )}
      {...props}
    >
      {children}
      {typeof count === 'number' ? <span className="opacity-80"> · {count}</span> : null}
    </button>
  );
});
