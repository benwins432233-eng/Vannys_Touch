import type { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

/**
 * Aucun écran ne doit rester muet (§4.5) : chargement, vide et erreur ont
 * chacun une représentation explicite.
 */

// ── Chargement ────────────────────────────────────────────────

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-token bg-muted', className)}
      {...props}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
  /** Libellé annoncé aux lecteurs d'écran pendant le chargement. */
  label?: string;
}

export function SkeletonList({ count = 6, className, label = 'Chargement en cours' }: SkeletonListProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className={cn('grid gap-4', className)}>
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

// ── Vide ──────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-4', className)}>
      <div className="mb-4 text-muted-foreground" aria-hidden="true">
        {icon ?? <Inbox className="w-10 h-10" />}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── Erreur ────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description = "Le chargement n'a pas abouti. Vérifiez votre connexion puis réessayez.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center text-center py-16 px-4', className)}
    >
      <AlertTriangle className="w-10 h-10 text-destructive mb-4" aria-hidden="true" />
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-6" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
