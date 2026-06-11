import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Store,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useCategories } from '@/hooks/useCategories';
import logo from '@/assets/logo.png';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();

  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { categories } = useCategories();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer les dropdowns au changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsShopDropdownOpen(false);
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Vanny's Touch" className="h-10 w-auto" />
            <span className="font-bold text-xl hidden sm:block text-gray-800">
              Vanny's Touch
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <Home className="w-5 h-5" />
              <span>Accueil</span>
            </Link>

            {/* Boutique avec dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsShopDropdownOpen(true)}
              onMouseLeave={() => setIsShopDropdownOpen(false)}
            >
              <Link
                to="/shop"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${isActive('/shop') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Store className="w-5 h-5" />
                <span>Boutique</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>

              {isShopDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                  <div className="p-2">
                    <Link
                      to="/shop"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                      onClick={() => setIsShopDropdownOpen(false)}
                    >
                      <Store className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-800">Tous les produits</span>
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                        onClick={() => setIsShopDropdownOpen(false)}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <span style={{ color: cat.color }}>
                            {cat.icon === 'laptop' && '💻'}
                            {cat.icon === 'tshirt' && '👕'}
                            {cat.icon === 'spa' && '✨'}
                            {cat.icon === 'home' && '🏠'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 block">{cat.name}</span>
                          <span className="text-xs text-gray-500">{cat.active_products_count ?? 0} produits</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Dark Mode Toggle */}
            <button
              onClick={toggle}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      {isAdmin && (
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Settings className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-700">Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="text-red-600">Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <User className="w-5 h-5" />
                <span>Connexion</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 animate-fadeIn">
          <div className="p-4 space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Accueil</span>
            </Link>
            <Link
              to="/shop"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/shop') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Store className="w-5 h-5" />
              <span className="font-medium">Boutique</span>
            </Link>

            <div className="pl-4 space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span style={{ color: cat.color }}>
                    {cat.icon === 'laptop' && '💻'}
                    {cat.icon === 'tshirt' && '👕'}
                    {cat.icon === 'spa' && '✨'}
                    {cat.icon === 'home' && '🏠'}
                  </span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white mt-4"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Se connecter</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
