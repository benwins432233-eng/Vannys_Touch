import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-deep text-deep-foreground mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-accent mb-3">Vannys Touch</h3>
            <p className="text-sm leading-relaxed text-deep-muted">
              Votre boutique de mode en ligne. Des collections soigneusement sélectionnées pour sublimer votre style.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://whatsapp.com/channel/0029VbC8i279Bb5vOARShm02"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Rejoindre la chaîne WhatsApp de Vannys Touch"
                className="p-2 rounded-token bg-deep-border/60 hover:bg-deep-border transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => alert('Page facebook non disponible pour le moment')}
                aria-label="Page Facebook (indisponible pour le moment)"
                className="p-2 rounded-token bg-deep-border/60 hover:bg-deep-border transition-colors"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/products', label: 'Boutique' },
                { to: '/orders', label: 'Mes commandes' },
                { to: '/profile', label: 'Mon profil' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-deep-muted hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                <a
                  href="mailto:vannystouch.shop@gmail.com"
                  className="text-deep-muted hover:text-accent transition-colors"
                >
                  vannystouch.shop@gmail.com
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                <a
                  href="https://wa.me/2290141196651"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-deep-muted hover:text-accent transition-colors"
                >
                  +229 01 41 19 66 51
                </a>
              </li>

              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <a
                  href="https://maps.app.goo.gl/v6D1x26R8XbUo9d7A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-deep-muted hover:text-accent transition-colors underline-offset-4 hover:underline"
                >
                  F82W+4P8, Abomey-Calavi, Bénin
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-deep-border mt-10 pt-6 text-center text-xs text-deep-muted">
          © {new Date().getFullYear()} Vannys Touch. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
