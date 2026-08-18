import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Info } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useCreateOrder } from '@/hooks/use-orders';
import { formatPrice } from '@/utils';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/utils/shipping';
import { Button, Card, InputField, LinkButton, TextareaField } from '@/components/ui';

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
        <LinkButton to="/cart" variant="ghost" size="sm" className="mb-8 -ml-3">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Retour au panier
        </LinkButton>

        <h1 className="text-2xl font-bold text-foreground mb-8">Finaliser la commande</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Livraison */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-5">Informations de livraison</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <InputField
                    label="Nom complet"
                    required
                    autoComplete="name"
                    placeholder="Prénom et Nom"
                    value={form.deliveryFullName}
                    onChange={set('deliveryFullName')}
                  />
                </div>
                <InputField
                  label="Téléphone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+229 01 XX XX XX XX"
                  value={form.deliveryPhone}
                  onChange={set('deliveryPhone')}
                />
                <InputField
                  label="Ville"
                  required
                  autoComplete="address-level2"
                  placeholder="Cotonou"
                  value={form.deliveryCity}
                  onChange={set('deliveryCity')}
                />
                <InputField
                  label="Arrondissement / Quartier"
                  required
                  placeholder="Cadjehoun"
                  value={form.deliveryDistrict}
                  onChange={set('deliveryDistrict')}
                />
                <InputField
                  label="Adresse complète"
                  required
                  autoComplete="street-address"
                  placeholder="Rue, numéro..."
                  value={form.deliveryAddress}
                  onChange={set('deliveryAddress')}
                />
                <div className="sm:col-span-2">
                  <InputField
                    label="Repère"
                    hint="Facultatif — aide le livreur à vous trouver."
                    placeholder="Près de la pharmacie..."
                    value={form.deliveryLandmark}
                    onChange={set('deliveryLandmark')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextareaField
                    label="Notes supplémentaires"
                    hint="Facultatif."
                    rows={3}
                    placeholder="Précisions sur votre commande..."
                    value={form.notes}
                    onChange={set('notes')}
                  />
                </div>
              </div>
            </Card>

            {/* Paiement */}
            <Card className="p-5 border-accent bg-accent/10">
              <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" aria-hidden="true" />
                Mode de paiement
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Le règlement s'effectue à la livraison. Notre équipe vous contactera par téléphone
                pour confirmer votre commande et vous préciser les modalités.
              </p>
            </Card>
          </div>

          {/* Récapitulatif */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="font-semibold text-foreground mb-4">Votre commande</h2>
              <ul className="space-y-3 mb-5">
                {items.map((item) => {
                  const img =
                    item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];
                  return (
                    <li
                      key={`${item.product.id}:${item.color ?? ''}:${item.size ?? ''}`}
                      className="flex gap-3"
                    >
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        {img && (
                          <img
                            src={img.urlThumbnail || img.url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {item.product.name}
                        </p>
                        {(item.color || item.size) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatPrice(Number(item.product.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Livraison</span>
                  {shipping === 0 ? (
                    <span className="text-success font-medium">Gratuite</span>
                  ) : (
                    <span>{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isPending}
                leftIcon={<ShoppingBag className="w-4 h-4" aria-hidden="true" />}
                className="w-full mt-5"
              >
                {isPending ? 'Envoi en cours...' : 'Passer la commande'}
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
