import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { SpinnerIcon } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  full?: boolean;
  /** Contenido secundario alineado a la derecha (p.ej. "1 firma · Base") */
  trailing?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-acc text-acc-fg shadow-[0_0_24px_rgba(0,255,0,0.25)] hover:opacity-90 disabled:shadow-none',
  secondary: 'bg-transparent text-fg border-2 border-line hover:border-mute',
  ghost: 'bg-transparent text-fg hover:bg-panel',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-11 px-4 text-sm rounded-[var(--r-md)]',
  lg: 'h-12 px-5 text-[15px] rounded-[var(--r-md)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    full = false,
    trailing,
    disabled,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      data-testid="ui-button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        full && 'w-full',
        trailing && 'justify-between px-4',
        className
      )}
      {...props}
    >
      {loading ? <SpinnerIcon size={size === 'lg' ? 20 : 18} /> : null}
      <span className="truncate">{children}</span>
      {trailing ? <span className="text-xs font-normal opacity-80 flex-shrink-0">{trailing}</span> : null}
    </button>
  );
});
