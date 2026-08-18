import { ShoppingBag, Trash2, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/utils';
import { Button, Drawer, EmptyState, LinkButton, QuantityStepper } from '@/components/ui';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const cart = useCart();

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title="Mon panier"
      description={
        cart.itemCount > 0
          ? `${cart.itemCount} article${cart.itemCount > 1 ? 's' : ''} — sous-total ${formatPrice(cart.subtotal)}`
          : 'Votre panier ne contient aucun article pour le moment.'
      }
      footer={
        cart.lines.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sous-total</span>
              <span className="font-medium text-foreground">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Livraison calculée à la commande. Gratuite dès{' '}
              {formatPrice(cart.freeShippingThreshold)}.
            </p>
            {cart.hasIssues && (
              <p className="text-xs text-destructive" role="alert">
                Ajustez les articles signalés avant de commander.
              </p>
            )}
            <LinkButton
              to="/checkout"
              onClick={closeCart}
              className={cart.hasIssues ? 'w-full pointer-events-none opacity-50' : 'w-full'}
              aria-disabled={cart.hasIssues || undefined}
            >
              Commander — {formatPrice(cart.subtotal)}
            </LinkButton>
            <Button variant="ghost" className="w-full" onClick={closeCart}>
              Continuer mes achats
            </Button>
          </div>
        ) : undefined
      }
    >
      {cart.lines.length === 0 ? (
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
          {cart.lines.map((line) => (
            <div key={line.key} className="flex gap-4">
              {/* Image */}
              <div className="w-20 h-24 rounded-token overflow-hidden bg-muted shrink-0">
                {line.imageUrl ? (
                  <img src={line.imageUrl} alt={line.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Détail */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground line-clamp-2 leading-snug">
                  {line.name}
                </p>
                {(line.color || line.size) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[line.color, line.size].filter(Boolean).join(' / ')}
                  </p>
                )}
                <p className="text-sm font-semibold mt-1 text-foreground">
                  {formatPrice(line.unitPrice)}
                </p>

                {line.alert && (
                  <p className="flex items-start gap-1.5 text-xs text-destructive mt-1" role="alert">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    {line.alert}
                  </p>
                )}

                {/* Quantité */}
                <div className="flex items-center gap-2 mt-2">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => cart.setQuantity(line, next)}
                    max={line.maxQuantity}
                    itemLabel={line.name}
                  />
                  <button
                    type="button"
                    onClick={() => cart.remove(line)}
                    aria-label={`Retirer ${line.name} du panier`}
                    className="ml-auto p-2 text-destructive hover:bg-destructive/10 rounded-token transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
