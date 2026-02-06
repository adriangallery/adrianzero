/**
 * ClaimButton Component
 * Reusable claim button with loading and disabled states
 */

import { Loader2 } from 'lucide-react';

interface ClaimButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  claimed?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function ClaimButton({
  onClick,
  disabled = false,
  loading = false,
  claimed = false,
  children,
  variant = 'primary',
  size = 'md',
}: ClaimButtonProps) {
  const baseClasses =
    'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: claimed
      ? 'bg-green-600 text-white'
      : 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading || claimed}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
