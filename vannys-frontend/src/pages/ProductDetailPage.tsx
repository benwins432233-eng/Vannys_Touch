import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, ChevronLeft, Check } from 'lucide-react';
import { useProduct } from '@/hooks/use-products';
import { useCartStore } from '@/store/cart.store';
import { useCart } from '@/hooks/use-cart';
import { formatPrice, getDiscountPercent, cn } from '@/utils';
import {
  colorsOf,
  findVariant,
  maxQuantityFor,
  sizesOf,
  stockForOption,
} from '@/utils/variants';
import toast from 'react-hot-toast';
import { Badge, Button, ErrorState, QuantityStepper, Skeleton } from '@/components/ui';

/** Déclinaison épuisée : visible, mais barrée et non sélectionnable. */
const UNAVAILABLE = 'opacity-50 line-through pointer-events-none';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(slug!);
  const { add } = useCart();
  const toggleCart = useCartStore((s) => s.toggleCart);

  const [selectedColor, setSelectedColor] = useState<string>();
  const [selectedSize, setSelectedSize] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="section page-container" role="status" aria-busy="true">
        <span className="sr-only">Chargement du produit</span>
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="section page-container">
        <ErrorState
          title="Produit introuvable"
          description="Cet article n'existe plus ou n'est pas disponible."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const colors = colorsOf(product.variants);
  const sizes = sizesOf(product.variants);

  // Le stock vit sur la combinaison choisie, pas sur le produit (lot L1).
  const selected = findVariant(product.variants, selectedColor, selectedSize);
  const selectionComplete =
    (!colors.length || selectedColor !== undefined) &&
    (!sizes.length || selectedSize !== undefined);
  const maxQuantity = maxQuantityFor(selected);
  const canOrder = selectionComplete && maxQuantity > 0;
  // Copie avant tri : `sort` modifie le tableau, ici celui du cache React Query.
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const discount = product.originalPrice
    ? getDiscountPercent(Number(product.price), Number(product.originalPrice))
    : 0;

  const handleAddToCart = () => {
    if (!canOrder) return;
    add(product, Math.min(quantity, maxQuantity), selectedColor, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    toast.success('Produit ajouté au panier !');
  };

  const handleBuyNow = () => {
    if (!canOrder) return;
    add(product, Math.min(quantity, maxQuantity), selectedColor, selectedSize);
    toggleCart();
  };

  /** Change un axe de sélection et ramène la quantité dans le stock disponible. */
  const pick = (axis: 'color' | 'size', value: string) => {
    const nextColor = axis === 'color' ? (value === selectedColor ? undefined : value) : selectedColor;
    const nextSize = axis === 'size' ? (value === selectedSize ? undefined : value) : selectedSize;
    setSelectedColor(nextColor);
    setSelectedSize(nextSize);

    const next = maxQuantityFor(findVariant(product.variants, nextColor, nextSize));
    if (next > 0 && quantity > next) setQuantity(next);
  };

  const optionClass = (isSelected: boolean) =>
    cn(
      'border-2 rounded-token text-sm transition-colors',
      isSelected
        ? 'border-accent text-foreground font-medium bg-accent/10'
        : 'border-border text-muted-foreground hover:border-accent/60 hover:text-foreground',
    );

  return (
    <div className="section">
      <div className="page-container">
        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="Fil d'Ariane">
          <Link to="/products" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Boutique
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Galerie */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-muted aspect-square mb-4">
              {images[activeImage] ? (
                <img
                  src={images[activeImage].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Voir la photo ${i + 1} sur ${images.length}`}
                    aria-current={i === activeImage}
                    className={cn(
                      'w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors',
                      i === activeImage ? 'border-accent' : 'border-transparent hover:border-border',
                    )}
                  >
                    <img
                      src={img.urlThumbnail || img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations */}
          <div>
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs uppercase tracking-widest font-medium text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-foreground mt-2 leading-tight">{product.name}</h1>

            {/* Note */}
            {product.reviewsCount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'w-4 h-4',
                        s <= Math.round(Number(product.rating))
                          ? 'fill-primary text-primary'
                          : 'text-border',
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {Number(product.rating).toFixed(1)} sur 5 ({product.reviewsCount} avis)
                </span>
              </div>
            )}

            {/* Prix */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge tone="destructive" className="text-sm">
                    -{discount}%
                  </Badge>
                </>
              )}
            </div>

            {product.badge && (
              <Badge tone="gold" className="mt-3">
                {product.badge}
              </Badge>
            )}

            {product.description && (
              <p className="text-muted-foreground mt-5 leading-relaxed">{product.description}</p>
            )}

            {/* Couleurs */}
            {colors.length > 0 && (
              <fieldset className="mt-6">
                <legend className="text-sm font-medium text-foreground mb-2">
                  Couleur{selectedColor && ` : ${selectedColor}`}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const stock = stockForOption(product.variants, 'color', color, selectedSize);
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-pressed={selectedColor === color}
                        disabled={stock === 0}
                        onClick={() => pick('color', color)}
                        className={cn(
                          'px-3 py-1.5',
                          optionClass(selectedColor === color),
                          stock === 0 && UNAVAILABLE,
                        )}
                      >
                        {color}
                        {stock === 0 && <span className="sr-only"> — indisponible</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Tailles */}
            {sizes.length > 0 && (
              <fieldset className="mt-4">
                <legend className="text-sm font-medium text-foreground mb-2">
                  Taille{selectedSize && ` : ${selectedSize}`}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const stock = stockForOption(product.variants, 'size', size, selectedColor);
                    return (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={selectedSize === size}
                        disabled={stock === 0}
                        onClick={() => pick('size', size)}
                        className={cn(
                          'w-12 h-10 font-medium',
                          optionClass(selectedSize === size),
                          stock === 0 && UNAVAILABLE,
                        )}
                      >
                        {size}
                        {stock === 0 && <span className="sr-only"> — indisponible</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Quantité */}
            <div className="mt-6 flex items-center gap-4 flex-wrap">
              <p className="text-sm font-medium text-foreground">Quantité</p>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={maxQuantity || 1}
                itemLabel={product.name}
                size="md"
              />
              {selected && selected.stock > 0 && selected.stock <= product.lowStockThreshold && (
                <Badge tone="warning">
                  Plus que {selected.stock} en stock
                </Badge>
              )}
            </div>

            {/* Actions */}
            {product.availability === 'out_of_stock' ? (
              <div className="mt-6 p-4 bg-muted rounded-token text-center">
                <p className="text-muted-foreground font-medium">
                  Ce produit est temporairement épuisé
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!canOrder}
                    className="flex-1"
                    leftIcon={
                      added ? (
                        <Check className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                      )
                    }
                  >
                    {added ? 'Ajouté !' : 'Ajouter au panier'}
                  </Button>
                  <Button variant="outline" disabled={!canOrder} onClick={handleBuyNow}>
                    Commander
                  </Button>
                </div>
                {/* Dire pourquoi le bouton est inactif plutôt que de le laisser muet. */}
                {!selectionComplete && (
                  <p className="text-sm text-muted-foreground" role="status">
                    Choisissez {[colors.length && 'une couleur', sizes.length && 'une taille']
                      .filter(Boolean)
                      .join(' et ')}{' '}
                    pour continuer.
                  </p>
                )}
                {selectionComplete && maxQuantity === 0 && (
                  <p className="text-sm text-destructive" role="status">
                    Cette déclinaison est épuisée. Essayez-en une autre.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
