import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border-2 border-accent text-foreground hover:bg-accent hover:text-accent-foreground',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  // 44px minimum : cible tactile confortable sur mobile
  icon: 'h-11 w-11',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-token font-semibold ' +
  'transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none';

/**
 * Classes d'un bouton. Partagées par `Button` et `LinkButton` : une navigation
 * reste un lien (clic milieu, ouverture dans un onglet) même si elle a l'allure
 * d'un bouton.
 */
export const buttonClasses = (
  variant: Variant = 'primary',
  size: Size = 'md',
  className?: string,
): string => cn(BASE, VARIANTS[variant], SIZES[size], className);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading, leftIcon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
});

export interface LinkButtonProps extends Omit<LinkProps, 'className'> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  className?: string;
}

/** Lien de navigation présenté comme un bouton. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {leftIcon}
      {children}
    </Link>
  );
}

export interface ExternalLinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
}

/** Lien sortant (WhatsApp, téléphone…) présenté comme un bouton. */
export function ExternalLinkButton({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className,
  children,
  ...props
}: ExternalLinkButtonProps) {
  return (
    <a className={buttonClasses(variant, size, className)} {...props}>
      {leftIcon}
      {children}
    </a>
  );
}
