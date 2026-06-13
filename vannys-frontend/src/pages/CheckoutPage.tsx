import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useCreateOrder } from '@/hooks/use-orders';
import { formatPrice } from '@/utils';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 2500;

export function CheckoutPage() {
  const { items } = useCartStore();
  const { mutate: createOrder, isPending } = useCreateOrder();

  const [form, setForm] = useState({
    deliveryFullName: '',
    deliveryPhone: '',
    deliveryCity: '',
    deliveryDistrict: '',
    deliveryAddress: '',
    deliveryLandmark: '',
    notes: '',
  });

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder({
      ...form,
      notes: form.notes || undefined,
      deliveryLandmark: form.deliveryLandmark || undefined,
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        color: i.color,
        size: i.size,
      })),
    });
  };

  return (
    <div className="section">
      <div className="page-container max-w-5xl">
        <Link to="/cart" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au panier
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Delivery form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Informations de livraison</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nom complet *</label>
                  <input required className="input" placeholder="Prénom et Nom" value={form.deliveryFullName} onChange={set('deliveryFullName')} />
                </div>
                <div>
                  <label className="label">Téléphone *</label>
                  <input required className="input" placeholder="+229 01 XX XX XX XX" value={form.deliveryPhone} onChange={set('deliveryPhone')} />
                </div>
                <div>
                  <label className="label">Ville *</label>
                  <input required className="input" placeholder="Cotonou" value={form.deliveryCity} onChange={set('deliveryCity')} />
                </div>
                <div>
                  <label className="label">Arrondissement / Quartier *</label>
                  <input required className="input" placeholder="Cadjehoun" value={form.deliveryDistrict} onChange={set('deliveryDistrict')} />
                </div>
                <div>
                  <label className="label">Adresse complète *</label>
                  <input required className="input" placeholder="Rue, numéro..." value={form.deliveryAddress} onChange={set('deliveryAddress')} />
                </div>
                <div>
                  <label className="label">Repère (optionnel)</label>
                  <input className="input" placeholder="Près de la pharmacie..." value={form.deliveryLandmark} onChange={set('deliveryLandmark')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Notes supplémentaires (optionnel)</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Précisions sur votre commande..."
                    value={form.notes}
                    onChange={set('notes')}
                  />
                </div>
              </div>
            </div>

            {/* Payment notice */}
            <div className="card p-5 bg-amber-50 border-amber-100">
              <h3 className="font-semibold text-amber-900 mb-2">💡 Mode de paiement</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Le règlement s'effectue à la livraison. Notre équipe vous contactera par téléphone pour confirmer votre commande et vous préciser les modalités.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Votre commande</h2>
              <div className="space-y-3 mb-5">
                {items.map((item) => {
                  const img = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];
                  return (
                    <div key={`${item.product.id}:${item.color}:${item.size}`} className="flex gap-3">
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {img && <img src={img.urlThumbnail || img.url} alt={item.product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        {(item.color || item.size) && (
                          <p className="text-xs text-gray-400">{[item.color, item.size].filter(Boolean).join(' / ')}</p>
                        )}
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="text-xs text-gray-400">× {item.quantity}</span>
                          <span className="text-sm font-medium">{formatPrice(Number(item.product.price) * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Livraison</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">Gratuite</span>
                  ) : (
                    <span>{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span style={{ color: 'var(--color-gold)' }}>{formatPrice(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={isPending} className="btn-primary w-full mt-5">
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Passer la commande</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
