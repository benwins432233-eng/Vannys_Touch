import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** En dessous du minimum, la ligne est retirée : à l'appelant de le gérer. */
  min?: number;
  max?: number;
  /** Nom de l'article : sans lui, deux boutons « + » se ressemblent à l'oreille. */
  itemLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: { button: 'w-8 h-8', icon: 'w-3 h-3', value: 'w-6 text-sm' },
  md: { button: 'w-10 h-10', icon: 'w-4 h-4', value: 'w-8 text-base' },
} as const;

/** Sélecteur de quantité — panier, tiroir et fiche produit partagent le même. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  itemLabel,
  size = 'sm',
  className,
}: QuantityStepperProps) {
  const s = SIZES[size];
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  const button = cn(
    s.button,
    'rounded-full border border-border flex items-center justify-center',
    'transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none',
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={atMin}
        aria-label={`Retirer un ${itemLabel}`}
        className={button}
      >
        <Minus className={s.icon} aria-hidden="true" />
      </button>
      <span className={cn('font-medium text-center tabular-nums', s.value)} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label={`Ajouter un ${itemLabel}`}
        className={button}
      >
        <Plus className={s.icon} aria-hidden="true" />
      </button>
    </div>
  );
}
