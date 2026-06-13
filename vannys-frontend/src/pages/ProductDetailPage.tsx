import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, ChevronLeft, Minus, Plus, Check } from 'lucide-react';
import { useProduct } from '@/hooks/use-products';
import { useCartStore } from '@/store/cart.store';
import { formatPrice, getDiscountPercent } from '@/utils';
import toast from 'react-hot-toast';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug!);
  const addItem = useCartStore((s) => s.addItem);
  const toggleCart = useCartStore((s) => s.toggleCart);

  const [selectedColor, setSelectedColor] = useState<string>();
  const [selectedSize, setSelectedSize] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="section page-container">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const colors = product.variants.filter((v) => v.type === 'COLOR');
  const sizes = product.variants.filter((v) => v.type === 'SIZE');
  const images = product.images.sort((a, b) => a.sortOrder - b.sortOrder);
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

  return (
    <div className="section">
      <div className="page-container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/products" className="flex items-center gap-1 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Boutique
          </Link>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square mb-4">
              {images[activeImage] ? (
                <img
                  src={images[activeImage].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                      i === activeImage ? 'border-[#c8a96e]' : 'border-transparent'
                    }`}
                  >
                    <img src={img.urlThumbnail || img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs uppercase tracking-widest font-medium hover:underline"
                style={{ color: 'var(--color-gold)' }}
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mt-2 leading-tight">{product.name}</h1>

            {/* Rating */}
            {product.reviewsCount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(Number(product.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviewsCount} avis)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {product.badge && (
              <span className="badge-gold mt-3 inline-block">{product.badge}</span>
            )}

            {product.description && (
              <p className="text-gray-600 mt-5 leading-relaxed">{product.description}</p>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Couleur{selectedColor && `: ${selectedColor}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.value === selectedColor ? undefined : c.value)}
                      className={`px-3 py-1.5 border-2 rounded-lg text-sm transition-colors ${
                        selectedColor === c.value
                          ? 'border-[#c8a96e] text-[#c8a96e] font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {c.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Taille{selectedSize && `: ${selectedSize}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.value === selectedSize ? undefined : s.value)}
                      className={`w-12 h-10 border-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSize === s.value
                          ? 'border-[#c8a96e] text-[#c8a96e]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-4">
              <p className="text-sm font-medium text-gray-700">Quantité</p>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            {product.inStock ? (
              <div className="mt-6 flex gap-3">
                <button onClick={handleAddToCart} className="btn-primary flex-1">
                  {added ? (
                    <><Check className="w-4 h-4" /> Ajouté !</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4" /> Ajouter au panier</>
                  )}
                </button>
                <button onClick={handleBuyNow} className="btn-outline px-5">
                  Commander
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-gray-500 font-medium">Ce produit est temporairement épuisé</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
