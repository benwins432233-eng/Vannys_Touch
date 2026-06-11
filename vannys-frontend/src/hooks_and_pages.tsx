// ============================================================
// src/hooks/useCart.tsx — VERSION API (Product type mis à jour)
// ============================================================
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { CartItem, Product } from '@/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: number, color?: string, size?: string) => void;
  updateQuantity: (productId: number, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity = 1, color?: string, size?: string) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.selected_color === color && i.selected_size === size
      );
      if (existing) {
        toast.success('Quantité mise à jour dans le panier');
        return prev.map(i =>
          i.product.id === product.id && i.selected_color === color && i.selected_size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      toast.success(`${product.name} ajouté au panier`);
      return [...prev, { product, quantity, selected_color: color, selected_size: size }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number, color?: string, size?: string) => {
    setItems(prev => {
      const item = prev.find(i => i.product.id === productId && i.selected_color === color && i.selected_size === size);
      if (item) toast.info(`${item.product.name} retiré du panier`);
      return prev.filter(i => !(i.product.id === productId && i.selected_color === color && i.selected_size === size));
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) { removeFromCart(productId, color, size); return; }
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId && i.selected_color === color && i.selected_size === size
          ? { ...i, quantity }
          : i
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.info('Panier vidé');
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}


// ============================================================
// src/pages/Login.tsx — VERSION API
// ============================================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', password: '', password_confirmation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (mode === 'register') {
      if (!form.first_name.trim()) e.first_name = 'Prénom requis';
      if (!form.last_name.trim()) e.last_name = 'Nom requis';
      if (form.password !== form.password_confirmation) e.password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    if (!form.email.includes('@')) e.email = 'Email invalide';
    if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let success: boolean;
      if (mode === 'login') {
        success = await login({ email: form.email, password: form.password });
      } else {
        success = await register({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          phone: form.phone || undefined,
        });
      }
      if (success) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full pl-12 pr-4 py-4 rounded-xl border-2 outline-none transition-all ${
      errors[field] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">Vanny's Touch</span>
          </Link>
          <p className="text-gray-500 mt-3">
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte gratuitement'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setErrors({}); }}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-5">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              {[['first_name', 'Prénom'], ['last_name', 'Nom']].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={form[field as keyof typeof form]}
                      onChange={e => set(field, e.target.value)}
                      className={inputClass(field)}
                      placeholder={label}
                    />
                  </div>
                  {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                className={inputClass('email')}
                placeholder="vous@exemple.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone (inscription) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone <span className="text-gray-400">(optionnel)</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className={inputClass('phone')}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className={`${inputClass('password')} pr-12`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirmation (inscription) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password_confirmation}
                  onChange={e => set('password_confirmation', e.target.value)}
                  className={inputClass('password_confirmation')}
                  placeholder="••••••••"
                />
              </div>
              {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center py-4 text-lg"
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <ArrowRight className="w-5 h-5" />
            }
            <span>{loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
