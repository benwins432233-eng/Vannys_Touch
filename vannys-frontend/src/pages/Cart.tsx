import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  Tag,
  Truck,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  const shipping = totalPrice > 50000 ? 0 : 2500;
  const discountAmount = promoApplied ? totalPrice * discount : 0;
  const finalTotal = totalPrice + shipping - discountAmount;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'vanny10') {
      setPromoApplied(true);
      setDiscount(0.1);
      toast.success('Code promo appliqué ! -10% de réduction');
    } else if (promoCode.toLowerCase() === 'welcome20') {
      setPromoApplied(true);
      setDiscount(0.2);
      toast.success('Code promo appliqué ! -20% de réduction');
    } else {
      toast.error('Code promo invalide');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour passer commande');
      navigate('/login');
      return;
    }
    navigate('/payment');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Votre panier est vide
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Ajoutez des articles à votre panier pour les voir apparaître ici. 
              Parcourez nos catégories pour découvrir nos produits.
            </p>
            <Link to="/shop" className="btn-primary">
              <ShoppingBag className="w-5 h-5" />
              <span>Découvrir nos produits</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Votre Panier</h1>
            <p className="text-gray-600 mt-1">{items.length} article{items.length > 1 ? 's' : ''}</p>
          </div>
          <Link 
            to="/shop" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Continuer mes achats</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div 
                key={`${item.product.id}-${item.selected_color}-${item.selected_size}`}
                className="bg-white rounded-2xl p-6 shadow-sm animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex gap-6">
                  {/* Image */}
                  <Link to={`/product/${item.product.id}`} className="w-24 h-24 flex-shrink-0">
                    <img
                      src={item.product.images?.[0]?.url ?? '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/product/${item.product.slug}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.selected_Color && `Couleur: ${item.selected_Color}`}
                          {item.selected_Color && item.selected_Size && ' | '}
                          {item.selected_Size && `Taille: ${item.selected_Size}`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selected_color, item.selected_size)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center border-2 border-gray-200 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selected_color, item.selected_size)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selected_color, item.selected_size)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {(Number(item.product.price) * item.quantity).toLocaleString()} FCFA
                        </span>
                        <p className="text-sm text-gray-500">
                          {Number(item.product.price).toLocaleString()} FCFA / unité
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium"
            >
              <Trash2 className="w-5 h-5" />
              <span>Vider le panier</span>
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Récapitulatif</h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code promo
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Entrez votre code"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      disabled={promoApplied}
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoApplied || !promoCode}
                    className="px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoApplied ? 'Appliqué' : 'Appliquer'}
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-sm text-green-600 mt-2">
                    Réduction de {Math.round(discount * 100)}% appliquée
                  </p>
                )}
              </div>

              {/* Summary Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{totalPrice.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Livraison
                  </span>
                  <span>{shipping === 0 ? 'Gratuit' : `${shipping.toLocaleString()} FCFA`}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction</span>
                    <span>-{discountAmount.toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{finalTotal.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full btn-primary justify-center text-lg py-4"
              >
                <span>Procéder au paiement</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Security Info */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Paiement 100% sécurisé</span>
              </div>

              {/* Payment Methods */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="w-12 h-8 bg-yellow-400 rounded flex items-center justify-center text-xs font-bold text-yellow-900">
                  MTN
                </div>
                <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">
                  MOOV
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
