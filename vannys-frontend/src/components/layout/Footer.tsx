import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3" style={{ color: '#c8a96e' }}>
              Vannys Touch
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Votre boutique de mode en ligne. Des collections soigneusement sélectionnées pour sublimer votre style.
            </p>
            <div className="flex gap-3 mt-4">
              <a 
                href="https://whatsapp.com/channel/0029VbC8i279Bb5vOARShm02" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <button 
                onClick={() => alert("Page facebook non disponible pour le moment")}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/products', label: 'Boutique' },
                { to: '/orders', label: 'Mes commandes' },
                { to: '/profile', label: 'Mon profil' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#c8a96e] shrink-0" />
                <a href="mailto:vannystouch.shop@gmail.com" className="hover:text-white transition-colors">
                  vannystouch.shop@gmail.com
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#c8a96e] shrink-0" />
                <a 
                  href="https://wa.me/2290141196651" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#c8a96e] transition-colors"
                >
                  +229 01 41 19 66 51
                </a>
              </li>

              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#c8a96e] shrink-0 mt-0.5" />
                <a 
                  href="https://maps.app.goo.gl/v6D1x26R8XbUo9d7A" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#c8a96e] transition-colors underline-offset-4 hover:underline"
                >
                  F82W+4P8, Abomey-Calavi, Bénin
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Vannys Touch. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
