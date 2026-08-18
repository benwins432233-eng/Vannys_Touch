import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-notifications';

/**
 * Cloche de l'en-tête avec pastille de non-lues.
 *
 * Un lien vers la page plutôt qu'un menu déroulant : le contenu est le même, et
 * un panneau flottant demanderait piège de focus, fermeture au clavier et
 * gestion du débordement sur mobile pour rien.
 */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useUnreadCount();

  return (
    <Link
      to="/notifications"
      className={`relative p-2 rounded-token hover:bg-muted transition-colors ${className ?? ''}`}
      aria-label={
        unread > 0 ? `Notifications, ${unread} non lue(s)` : 'Notifications, aucune non lue'
      }
    >
      <Bell className="w-5 h-5 text-foreground" aria-hidden="true" />
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full
                     flex items-center justify-center bg-destructive text-destructive-foreground"
          aria-hidden="true"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
