import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, getDiscountPercent } from '@/utils';
import { useAddToCart } from '@/hooks/use-cart';
import { needsSelection } from '@/utils/variants';
import { Badge } from '@/components/ui';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const add = useAddToCart();
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const discount = product.originalPrice
    ? getDiscountPercent(Number(product.price), Number(product.originalPrice))
    : 0;

  // Un produit décliné ne peut pas être ajouté d'un clic : sans taille ni
  // couleur, le serveur ne saurait pas quel stock engager.
  const mustChoose = needsSelection(product);
  const orderable = product.availability !== 'out_of_stock' && product.availability !== 'disabled';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!orderable || mustChoose) return;
    add(product);
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="card overflow-hidden transition-shadow duration-300 group-hover:shadow-card-hover">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.urlMedium || primaryImage.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {product.badge && <Badge tone="gold">{product.badge}</Badge>}
            {discount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">-{discount}%</Badge>
            )}
            {product.availability === 'out_of_stock' && (
              <Badge className="bg-deep text-deep-foreground">Épuisé</Badge>
            )}
            {product.availability === 'low_stock' && (
              <Badge tone="warning">Derniers articles</Badge>
            )}
          </div>

          {/* Ajout rapide */}
          {orderable && (
            <button
              onClick={mustChoose ? undefined : handleAddToCart}
              tabIndex={mustChoose ? -1 : undefined}
              aria-hidden={mustChoose || undefined}
              className="absolute bottom-0 left-0 right-0 py-3 text-sm font-semibold text-center
                         bg-primary text-primary-foreground
                         opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                         focus-visible:opacity-100 focus-visible:translate-y-0
                         transition-all duration-200"
            >
              {mustChoose ? 'Choisir une déclinaison' : 'Ajouter au panier'}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewsCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">
                {Number(product.rating).toFixed(1)} ({product.reviewsCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
