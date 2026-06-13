import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/utils';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
            <h2 className="font-semibold text-gray-900">Mon panier</h2>
            {itemCount > 0 && (
              <span className="badge-gold text-xs">{itemCount}</span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingBag className="w-12 h-12 text-gray-200" />
              <div>
                <p className="font-medium text-gray-700">Votre panier est vide</p>
                <p className="text-sm text-gray-400 mt-1">Ajoutez des produits pour commencer</p>
              </div>
              <button onClick={closeCart} className="btn-outline text-sm py-2">
                Continuer mes achats
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const key = `${item.product.id}:${item.color ?? ''}:${item.size ?? ''}`;
                const primaryImage =
                  item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];

                return (
                  <div key={key} className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {primaryImage ? (
                        <img
                          src={primaryImage.urlThumbnail || primaryImage.url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug">
                        {item.product.name}
                      </p>
                      {(item.color || item.size) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[item.color, item.size].filter(Boolean).join(' / ')}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-gold)' }}>
                        {formatPrice(item.product.price)}
                      </p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1, item.color, item.size)
                          }
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1, item.color, item.size)
                          }
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id, item.color, item.size)}
                          className="ml-auto p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sous-total</span>
              <span className="font-medium text-gray-900">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400">
              Livraison calculée à la commande. Gratuite dès 50 000 FCFA.
            </p>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center"
            >
              Commander — {formatPrice(total)}
            </Link>
            <button onClick={closeCart} className="btn-ghost w-full text-sm">
              Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </>
  );
}
