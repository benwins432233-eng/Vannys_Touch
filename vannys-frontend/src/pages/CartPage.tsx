import { ShoppingBag, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/utils';
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  QuantityStepper,
  SkeletonList,
} from '@/components/ui';

export function CartPage() {
  const cart = useCart();

  if (cart.isLoading) {
    return (
      <div className="section page-container">
        <SkeletonList count={3} label="Chargement de votre panier" />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="section page-container">
        <EmptyState
          className="max-w-md mx-auto"
          icon={<ShoppingBag className="w-14 h-14" />}
          title="Votre panier est vide"
          description="Découvrez notre boutique et ajoutez des produits."
          action={
            <LinkButton to="/products">
              Découvrir la boutique
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </LinkButton>
          }
        />
      </div>
    );
  }

  const missing = cart.freeShippingThreshold - cart.subtotal;

  return (
    <div className="section">
      <div className="page-container">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          Mon panier ({cart.lines.length} article{cart.lines.length > 1 ? 's' : ''})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lignes du panier */}
          <div className="lg:col-span-2 space-y-4">
            {cart.lines.map((line) => (
              <Card key={line.key} className="p-5 flex gap-5">
                <div className="w-24 h-28 rounded-token overflow-hidden bg-muted shrink-0">
                  {line.imageUrl && (
                    <img
                      src={line.imageUrl}
                      alt={line.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground">{line.name}</h2>
                      {(line.color || line.size) && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {[line.color, line.size].filter(Boolean).join(' / ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(line)}
                      aria-label={`Retirer ${line.name} du panier`}
                      className="p-2 h-9 rounded-token text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="font-bold text-lg mt-2 text-foreground">
                    {formatPrice(line.subtotal)}
                  </p>

                  {line.alert && (
                    <p
                      className="flex items-start gap-1.5 text-sm text-destructive mt-1"
                      role="alert"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      {line.alert}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(next) => cart.setQuantity(line, next)}
                      max={line.maxQuantity}
                      itemLabel={line.name}
                    />
                    <span className="text-sm text-muted-foreground">
                      × {formatPrice(line.unitPrice)} / pièce
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="ghost" size="sm" className="text-destructive" onClick={cart.clear}>
              Vider le panier
            </Button>
          </div>

          {/* Récapitulatif */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="font-semibold text-foreground mb-5">Récapitulatif</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium text-foreground">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  {cart.shippingFee === 0 ? (
                    <span className="text-success font-medium">Gratuite</span>
                  ) : (
                    <span className="font-medium text-foreground">
                      {formatPrice(cart.shippingFee)}
                    </span>
                  )}
                </div>
                {cart.shippingFee > 0 && missing > 0 && (
                  <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-token">
                    Plus que {formatPrice(missing)} pour la livraison gratuite !
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(cart.total)}</span>
                </div>
              </div>

              {cart.hasIssues && (
                <p className="text-sm text-destructive mt-4" role="alert">
                  Un ou plusieurs articles ne sont plus disponibles dans la quantité demandée.
                  Ajustez-les pour continuer.
                </p>
              )}

              <LinkButton
                to="/checkout"
                className={cart.hasIssues ? 'w-full mt-6 pointer-events-none opacity-50' : 'w-full mt-6'}
                aria-disabled={cart.hasIssues || undefined}
              >
                Commander maintenant
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton to="/products" variant="ghost" className="w-full mt-2">
                Continuer mes achats
              </LinkButton>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
