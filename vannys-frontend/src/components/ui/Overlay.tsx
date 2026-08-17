import { useCallback, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Base commune aux boîtes de dialogue et aux tiroirs.
 *
 * `title` et `description` sont OBLIGATOIRES et reliés par aria-labelledby /
 * aria-describedby : c'est l'exigence §4.4, et la cause de l'avertissement
 * « Missing Description or aria-describedby for DialogContent » déjà rencontré.
 * Une description peut être visuellement masquée, jamais absente.
 */
interface OverlayBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Masque la description à l'écran tout en la laissant aux lecteurs d'écran. */
  hideDescription?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function useOverlayBehaviour(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      // Piège de focus : Tab ne doit jamais sortir du panneau ouvert.
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    // Donner le focus au panneau plutôt qu'à un bouton précis : le lecteur
    // d'écran annonce alors le titre et la description.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onKeyDown]);

  return panelRef;
}

// ── Boîte de dialogue centrée ─────────────────────────────────

export function Dialog({
  open,
  onClose,
  title,
  description,
  hideDescription,
  children,
  footer,
}: OverlayBaseProps) {
  const panelRef = useOverlayBehaviour(open, onClose);
  const titleId = useId();
  const descId = useId();

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg max-h-[85vh] overflow-y-auto',
          'bg-card text-card-foreground rounded-token border border-border shadow-card-hover',
          'animate-fade-in focus:outline-none',
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <p
              id={descId}
              className={cn('text-sm text-muted-foreground mt-1', hideDescription && 'sr-only')}
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="shrink-0 p-2 -m-2 rounded-token text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Tiroir latéral ────────────────────────────────────────────

interface DrawerProps extends OverlayBaseProps {
  side?: 'right' | 'left';
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  hideDescription,
  side = 'right',
  children,
  footer,
}: DrawerProps) {
  const panelRef = useOverlayBehaviour(open, onClose);
  const titleId = useId();
  const descId = useId();

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={cn(
          'absolute top-0 bottom-0 w-full max-w-md flex flex-col',
          'bg-card text-card-foreground border-border shadow-card-hover',
          'animate-slide-in-right focus:outline-none',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <p
              id={descId}
              className={cn('text-sm text-muted-foreground mt-1', hideDescription && 'sr-only')}
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="shrink-0 p-2 -m-2 rounded-token text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && <div className="p-5 border-t border-border">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
