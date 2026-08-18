import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import type { ThemeMode } from '@/store/theme.store';
import { cn } from '@/utils';

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'light', label: 'Thème clair', Icon: Sun },
  { mode: 'dark', label: 'Thème sombre', Icon: Moon },
  { mode: 'system', label: 'Thème du système', Icon: Monitor },
];

/** Bascule clair / sombre / système, présente dans l'en-tête boutique et admin. */
export function ThemeToggle({ className }: { className?: string }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div
      role="radiogroup"
      aria-label="Apparence"
      className={cn('inline-flex items-center gap-1 p-1 rounded-token bg-muted', className)}
    >
      {OPTIONS.map(({ mode: value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => setMode(value)}
          className={cn(
            'p-2 rounded-token transition-colors duration-200',
            mode === value
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
