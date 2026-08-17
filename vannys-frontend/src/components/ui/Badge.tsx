import type { HTMLAttributes } from 'react';
import { cn } from '@/utils';

export type BadgeTone = 'neutral' | 'gold' | 'success' | 'warning' | 'destructive' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  gold: 'bg-accent text-accent-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  info: 'bg-foreground/10 text-foreground',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
