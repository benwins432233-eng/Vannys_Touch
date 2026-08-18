import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Info } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useCreateOrder } from '@/hooks/use-orders';
import { formatPrice } from '@/utils';
import {
  Button,
  Card,
  InputField,
  LinkButton,
  SkeletonList,
  TextareaField,
} from '@/components/ui';

export function CheckoutPage() {
  const cart = useCart();
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

  // Les montants affichés viennent du panier ; le serveur les recalcule à la
  // création de la commande et c'est lui qui fait foi (§2.3).
  if (cart.isLoading) {
    return (
      <div className="section page-container max-w-5xl">
        <SkeletonList count={2} label="Chargement de votre commande" />
      </div>
    );
  }

  if (cart.lines.length === 0) return <Navigate to="/cart" replace />;
  // Un panier qui ne peut pas partir renvoie au panier, où l'article est signalé.
  if (cart.hasIssues) return <Navigate to="/cart" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder({
      ...form,
      notes: form.notes || undefined,
      deliveryLandmark: form.deliveryLandmark || undefined,
      // Aucune ligne envoyée : le serveur lit le panier, seul juge du contenu
      // comme des montants (§2.3).
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
                {cart.lines.map((line) => (
                  <li key={line.key} className="flex gap-3">
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                      {line.imageUrl && (
                        <img
                          src={line.imageUrl}
                          alt={line.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {line.name}
                      </p>
                      {(line.color || line.size) && (
                        <p className="text-xs text-muted-foreground">
                          {[line.color, line.size].filter(Boolean).join(' / ')}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-xs text-muted-foreground">× {line.quantity}</span>
                        <span className="text-sm font-medium text-foreground">
                          {formatPrice(line.subtotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Livraison</span>
                  {cart.shippingFee === 0 ? (
                    <span className="text-success font-medium">Gratuite</span>
                  ) : (
                    <span>{formatPrice(cart.shippingFee)}</span>
                  )}
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
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
