import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ── Icônes SVG custom ─────────────────────────────────────────
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Merci de votre inscription à la newsletter !');
      setEmail('');
    }
  };

  const footerLinks = {
    boutique: [
      { label: 'Tous les produits', path: '/shop' },
      { label: 'Électronique', path: '/shop?category=electronics' },
      { label: 'Mode', path: '/shop?category=fashion' },
      { label: 'Beauté', path: '/shop?category=beauty' },
      { label: 'Maison', path: '/shop?category=home' },
    ],
    support: [
      { label: 'Centre d\'aide', path: '#' },
      { label: 'Livraison & Retours', path: '#' },
      { label: 'FAQ', path: '#' },
      { label: 'Contactez-nous', path: '#' },
    ],
    legal: [
      { label: 'Conditions d\'utilisation', path: '#' },
      { label: 'Politique de confidentialité', path: '#' },
      { label: 'Cookies', path: '#' },
    ],
  };

  const socialLinks = [
    {
      icon: <TikTokIcon />,
      label: 'TikTok',
      href: null, // pas encore disponible
      hoverClass: 'hover:bg-gray-700',
      onClick: () => toast.info('Pas encore accessible'),
    },
    {
      icon: <WhatsAppIcon />,
      label: 'WhatsApp',
      href: 'https://wa.me/2290141196651',
      hoverClass: 'hover:bg-green-600',
      onClick: null,
    },
    {
      icon: <FacebookIcon />,
      label: 'Facebook',
      href: null, // pas encore disponible
      hoverClass: 'hover:bg-blue-700',
      onClick: () => toast.info('Pas encore accessible'),
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="font-bold text-xl text-white">Vanny's Touch</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Votre destination privilégiée pour la mode, la technologie et le lifestyle.
              Découvrez des produits de qualité sélectionnés avec soin.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-blue-500" />
                <a href="https://wa.me/2290141196651" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white transition-colors">+229 01 41 19 66 51</a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 text-blue-500" />
                <a href="mailto:vannystouch.shop@gmail.com" className="hover:text-white transition-colors">
                  vannystouch.shop@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span>Cotonou, Bénin</span>
              </div>
            </div>
          </div>

          {/* Boutique Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Boutique</h3>
            <ul className="space-y-3">
              {footerLinks.boutique.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-gray-400 hover:text-white transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Soutien</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-gray-400 hover:text-white transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Bulletin</h3>
            <p className="text-gray-400 mb-4">
              Inscrivez-vous pour recevoir nos offres exclusives et nouveautés.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="submit" className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </form>

            {/* Réseaux sociaux */}
            <div className="mt-8">
              <h4 className="font-medium mb-4">Suivez-nous</h4>
              <div className="flex gap-3">
                {socialLinks.map(({ icon, label, href, hoverClass, onClick }) => (
                  href ? (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-colors ${hoverClass}`}
                    >
                      {icon}
                    </a>
                  ) : (
                    <button
                      key={label}
                      onClick={onClick ?? undefined}
                      aria-label={label}
                      className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-colors ${hoverClass} cursor-pointer`}
                    >
                      {icon}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Vanny's Touch. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link key={link.label} to={link.path} className="text-gray-500 hover:text-white text-sm transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              Fait avec <Heart className="w-4 h-4 text-red-500 fill-red-500 mx-1" /> par{' '}
              <button
                onClick={() => toast.info('Site bientôt disponible')}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline underline-offset-2 ml-1"
              >
                AfriNova
              </button>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
