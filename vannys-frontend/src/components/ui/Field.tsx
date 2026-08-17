import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils';

const CONTROL =
  'w-full px-4 py-3 rounded-token text-sm bg-background text-foreground ' +
  'border border-input placeholder:text-muted-foreground transition-shadow duration-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const INVALID = 'border-destructive focus:ring-destructive';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/** Habillage commun : libellé lié au champ, aide et erreur reliées par aria-describedby. */
function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string): string | undefined => {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
};

// ── Champ texte ───────────────────────────────────────────────

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, hint, error, className, required, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, error && INVALID, className)}
        {...props}
      />
    </FieldShell>
  );
});

// ── Zone de texte ─────────────────────────────────────────────

export interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, hint, error, className, required, ...props }, ref) {
    const id = useId();
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
        <textarea
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(CONTROL, 'min-h-24 resize-y', error && INVALID, className)}
          {...props}
        />
      </FieldShell>
    );
  },
);

// ── Liste déroulante ──────────────────────────────────────────

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, className, required, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, 'pr-10', error && INVALID, className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});
