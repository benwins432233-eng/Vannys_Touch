import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, ChevronLeft, Check } from 'lucide-react';
import { useProduct } from '@/hooks/use-products';
import { useCartStore } from '@/store/cart.store';
import { formatPrice, getDiscountPercent, cn } from '@/utils';
import toast from 'react-hot-toast';
import { Badge, Button, ErrorState, QuantityStepper, Skeleton } from '@/components/ui';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(slug!);
  const addItem = useCartStore((s) => s.addItem);
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

  const colors = product.variants.filter((v) => v.type === 'COLOR');
  const sizes = product.variants.filter((v) => v.type === 'SIZE');
  // Copie avant tri : `sort` modifie le tableau, ici celui du cache React Query.
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const discount = product.originalPrice
    ? getDiscountPercent(Number(product.price), Number(product.originalPrice))
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedColor, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    toast.success('Produit ajouté au panier !');
  };

  const handleBuyNow = () => {
    addItem(product, quantity, selectedColor, selectedSize);
    toggleCart();
  };

  const optionClass = (selected: boolean) =>
    cn(
      'border-2 rounded-token text-sm transition-colors',
      selected
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
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={selectedColor === c.value}
                      onClick={() =>
                        setSelectedColor(c.value === selectedColor ? undefined : c.value)
                      }
                      className={cn('px-3 py-1.5', optionClass(selectedColor === c.value))}
                    >
                      {c.value}
                    </button>
                  ))}
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
                  {sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={selectedSize === s.value}
                      onClick={() => setSelectedSize(s.value === selectedSize ? undefined : s.value)}
                      className={cn(
                        'w-12 h-10 font-medium',
                        optionClass(selectedSize === s.value),
                      )}
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Quantité */}
            <div className="mt-6 flex items-center gap-4">
              <p className="text-sm font-medium text-foreground">Quantité</p>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                itemLabel={product.name}
                size="md"
              />
            </div>

            {/* Actions */}
            {product.inStock ? (
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleAddToCart}
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
                <Button variant="outline" onClick={handleBuyNow}>
                  Commander
                </Button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-muted rounded-token text-center">
                <p className="text-muted-foreground font-medium">
                  Ce produit est temporairement épuisé
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
