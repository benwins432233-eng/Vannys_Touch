import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, getDiscountPercent } from '@/utils';
import { useCartStore } from '@/store/cart.store';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const discount = product.originalPrice
    ? getDiscountPercent(Number(product.price), Number(product.originalPrice))
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;
    addItem(product);
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="card overflow-hidden transition-shadow duration-300 group-hover:shadow-card-hover">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.urlMedium || primaryImage.url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <span className="badge-gold text-xs">{product.badge}</span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
            {!product.inStock && (
              <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Épuisé
              </span>
            )}
          </div>

          {/* Quick add */}
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-0 left-0 right-0 py-3 text-sm font-semibold text-white text-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
              style={{ background: 'var(--color-gold)' }}
            >
              Ajouter au panier
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewsCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-500">
                {Number(product.rating).toFixed(1)} ({product.reviewsCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
