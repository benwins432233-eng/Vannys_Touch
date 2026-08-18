import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Lien de bascule vers l'autre parcours (connexion ↔ inscription). */
  footer: ReactNode;
}

/**
 * Habillage commun aux écrans de connexion et d'inscription : même en-tête,
 * même carte, même pied. Évite de recopier les classes d'une page à l'autre.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary">
            Vannys Touch
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-4">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <Card className="p-8">
          {children}
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        </Card>
      </div>
    </div>
  );
}
