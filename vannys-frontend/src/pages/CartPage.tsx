import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/utils';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/utils/shipping';
import { Button, Card, EmptyState, LinkButton, QuantityStepper } from '@/components/ui';

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  if (items.length === 0) {
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

  return (
    <div className="section">
      <div className="page-container">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          Mon panier ({items.length} article{items.length > 1 ? 's' : ''})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lignes du panier */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const key = `${item.product.id}:${item.color ?? ''}:${item.size ?? ''}`;
              const img = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];

              return (
                <Card key={key} className="p-5 flex gap-5">
                  <div className="w-24 h-28 rounded-token overflow-hidden bg-muted shrink-0">
                    {img && (
                      <img
                        src={img.urlMedium || img.url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-foreground">{item.product.name}</h2>
                        {(item.color || item.size) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id, item.color, item.size)}
                        aria-label={`Retirer ${item.product.name} du panier`}
                        className="p-2 h-9 rounded-token text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="font-bold text-lg mt-2 text-foreground">
                      {formatPrice(Number(item.product.price) * item.quantity)}
                    </p>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(next) =>
                          updateQuantity(item.product.id, next, item.color, item.size)
                        }
                        itemLabel={item.product.name}
                      />
                      <span className="text-sm text-muted-foreground">
                        × {formatPrice(item.product.price)} / pièce
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}

            <Button variant="ghost" size="sm" className="text-destructive" onClick={clearCart}>
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
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  {shipping === 0 ? (
                    <span className="text-success font-medium">Gratuite</span>
                  ) : (
                    <span className="font-medium text-foreground">{formatPrice(shipping)}</span>
                  )}
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-token">
                    Plus que {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} pour la livraison
                    gratuite !
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(total)}</span>
                </div>
              </div>

              <LinkButton to="/checkout" className="w-full mt-6">
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
