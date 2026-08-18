import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useCart } from '@/hooks/use-cart';
import { useLogout } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui';

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { itemCount } = useCart();
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { mutate: logout } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/products', label: 'Boutique' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">Vannys Touch</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:inline-flex" />

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 rounded-token hover:bg-muted transition-colors"
              aria-label={
                itemCount > 0 ? `Panier, ${itemCount} article(s)` : 'Panier, vide'
              }
            >
              <ShoppingBag className="w-5 h-5 text-foreground" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {user?.role === 'admin' && (
                  <Link to="/admin" className="btn-ghost text-sm">
                    <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="btn-ghost text-sm">
                  <User className="w-4 h-4" aria-hidden="true" />
                  {user?.firstName}
                </Link>
                <button
                  onClick={() => logout()}
                  aria-label="Se déconnecter"
                  className="btn-ghost text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Connexion</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-token hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {menuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border space-y-2">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-token text-sm font-medium ${
                    isActive
                      ? 'bg-accent/15 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-token">Dashboard admin</Link>
                )}
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-token">Mon profil</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-token">Mes commandes</Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-token"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-token">Connexion</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-primary hover:bg-accent/15 rounded-token">S'inscrire</Link>
              </>
            )}

            <div className="pt-2 px-3 sm:hidden">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
