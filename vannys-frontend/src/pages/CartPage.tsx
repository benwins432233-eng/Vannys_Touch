import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/utils';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 2500;

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="section page-container">
        <div className="max-w-md mx-auto text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h1>
          <p className="text-gray-500 mb-8">Découvrez notre boutique et ajoutez des produits.</p>
          <Link to="/products" className="btn-primary">
            Découvrir la boutique
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="page-container">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon panier ({items.length} article{items.length > 1 ? 's' : ''})</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const key = `${item.product.id}:${item.color ?? ''}:${item.size ?? ''}`;
              const img = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];

              return (
                <div key={key} className="card p-5 flex gap-5">
                  <div className="w-24 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {img && <img src={img.urlMedium || img.url} alt={item.product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        {(item.color || item.size) && (
                          <p className="text-sm text-gray-400 mt-0.5">
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </p>
                        )}
                      </div>
                      <button onClick={() => removeItem(item.product.id, item.color, item.size)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="font-bold text-lg mt-2" style={{ color: 'var(--color-gold)' }}>
                      {formatPrice(Number(item.product.price) * item.quantity)}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.color, item.size)}
                        className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.color, item.size)}
                        className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-sm text-gray-400 ml-2">
                        × {formatPrice(item.product.price)} / pièce
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 underline mt-2">
              Vider le panier
            </button>
          </div>

          {/* Summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-5">Récapitulatif</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Livraison</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">Gratuite ✓</span>
                  ) : (
                    <span className="font-medium">{formatPrice(shipping)}</span>
                  )}
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400 bg-amber-50 px-3 py-2 rounded-lg">
                    Plus que {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} pour la livraison gratuite !
                  </p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span style={{ color: 'var(--color-gold)' }}>{formatPrice(total)}</span>
                </div>
              </div>

              <Link to="/checkout" className="btn-primary w-full mt-6 text-center">
                Commander maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/products" className="btn-ghost w-full mt-2 text-sm text-center">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
