import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'mute' | 'acc';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  ok: 'bg-ok/15 text-ok border-ok/30',
  warn: 'bg-warn/15 text-warn border-warn/30',
  bad: 'bg-bad/15 text-bad border-bad/30',
  mute: 'bg-mute/15 text-mute border-mute/30',
  acc: 'bg-acc/15 text-acc border-acc/30',
};

export function Badge({ tone = 'mute', className, ...props }: BadgeProps) {
  return (
    <span
      data-testid="ui-badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
