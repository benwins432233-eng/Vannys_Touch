import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils';

type Tone = 'neutral' | 'primary' | 'destructive' | 'success';

const TONES: Record<Tone, string> = {
  neutral: 'text-muted-foreground hover:text-foreground hover:bg-muted',
  primary: 'text-muted-foreground hover:text-primary hover:bg-accent/15',
  destructive: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
  success: 'text-muted-foreground hover:text-success hover:bg-success/10',
};

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Obligatoire : une icône seule ne dit rien à un lecteur d'écran (§4.4). */
  label: string;
  icon: ReactNode;
  tone?: Tone;
}

/** Bouton d'action réduit à une icône, toujours nommé. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, tone = 'neutral', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'p-2 rounded-token transition-colors disabled:opacity-40 disabled:pointer-events-none',
        TONES[tone],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
});
