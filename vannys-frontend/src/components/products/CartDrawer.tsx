import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/utils';
import { FREE_SHIPPING_THRESHOLD } from '@/utils/shipping';
import { Button, Drawer, EmptyState, LinkButton, QuantityStepper } from '@/components/ui';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title="Mon panier"
      description={
        itemCount > 0
          ? `${itemCount} article${itemCount > 1 ? 's' : ''} — sous-total ${formatPrice(total)}`
          : 'Votre panier ne contient aucun article pour le moment.'
      }
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sous-total</span>
              <span className="font-medium text-foreground">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Livraison calculée à la commande. Gratuite dès {formatPrice(FREE_SHIPPING_THRESHOLD)}.
            </p>
            <LinkButton to="/checkout" onClick={closeCart} className="w-full">
              Commander — {formatPrice(total)}
            </LinkButton>
            <Button variant="ghost" className="w-full" onClick={closeCart}>
              Continuer mes achats
            </Button>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="Votre panier est vide"
          description="Ajoutez des produits pour commencer."
          action={
            <Button variant="outline" onClick={closeCart}>
              Continuer mes achats
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const key = `${item.product.id}:${item.color ?? ''}:${item.size ?? ''}`;
            const primaryImage =
              item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];

            return (
              <div key={key} className="flex gap-4">
                {/* Image */}
                <div className="w-20 h-24 rounded-token overflow-hidden bg-muted shrink-0">
                  {primaryImage ? (
                    <img
                      src={primaryImage.urlThumbnail || primaryImage.url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground line-clamp-2 leading-snug">
                    {item.product.name}
                  </p>
                  {(item.color || item.size) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[item.color, item.size].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-1 text-foreground">
                    {formatPrice(item.product.price)}
                  </p>

                  {/* Quantité */}
                  <div className="flex items-center gap-2 mt-2">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(next) =>
                        updateQuantity(item.product.id, next, item.color, item.size)
                      }
                      itemLabel={item.product.name}
                    />
                    <button
                      onClick={() => removeItem(item.product.id, item.color, item.size)}
                      aria-label={`Retirer ${item.product.name} du panier`}
                      className="ml-auto p-2 text-destructive hover:bg-destructive/10 rounded-token transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
