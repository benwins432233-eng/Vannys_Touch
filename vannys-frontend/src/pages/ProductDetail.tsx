// ============================================================
// src/pages/ProductDetail.tsx — VERSION API
// ============================================================
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingBag, Heart, Share2, Star,
  Truck, Shield, RefreshCw, Minus, Plus, Loader2
} from 'lucide-react';
import { useProduct } from '@/hooks/useProduct';
import { useProducts } from '@/hooks/useProducts';

import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const { product, loading, error } = useProduct(slug);

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Produits similaires (même catégorie)
  const { products: related } = useProducts(
    product ? { category: product.category?.slug, per_page: 4 } : undefined
  );
  const relatedProducts = related.filter(p => p.id !== product?.id).slice(0, 4);

  // ---- Loading ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ---- Erreur / 404 ----
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h2>
          <button onClick={() => navigate('/shop')} className="btn-primary">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à la boutique</span>
          </button>
        </div>
      </div>
    );
  }

  // ---- Données ----
  const images = product.images ?? [];
  const primaryIndex = images.findIndex(i => i.is_primary);
  const orderedImages = primaryIndex > 0
    ? [images[primaryIndex], ...images.filter((_, i) => i !== primaryIndex)]
    : images;

  const activeImage = orderedImages[activeImageIndex];
  const colors = product.variants?.filter(v => v.type === 'color').map(v => v.value) ?? [];
  const sizes = product.variants?.filter(v => v.type === 'size').map(v => v.value) ?? [];
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-blue-600 transition-colors">Boutique</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/shop/${product.category.slug}`} className="hover:text-blue-600 transition-colors capitalize">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Galerie images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-3xl overflow-hidden shadow-sm">
              <img
                src={activeImage?.url ?? '/placeholder.png'}
                alt={activeImage?.alt_text ?? product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-full">
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-full">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Miniatures */}
            {orderedImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {orderedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={img.url_thumbnail ?? img.url}
                      alt={img.alt_text ?? ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos produit */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <span className="text-sm text-blue-600 font-medium uppercase tracking-wide">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-gray-600">{product.rating} ({product.reviews_count} avis)</span>
              </div>
            </div>

            {/* Prix */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-gray-900">{product.price.toLocaleString()} FCFA</span>
              {product.original_price && (
                <span className="text-2xl text-gray-400 line-through">{product.original_price.toLocaleString()} FCFA</span>
              )}
            </div>

            <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>

            {/* Couleurs */}
            {colors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Couleur</h3>
                <div className="flex gap-3 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all ${selectedColor === color
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tailles */}
            {sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Taille</h3>
                <div className="flex gap-3 flex-wrap">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-xl border-2 font-medium transition-all ${selectedSize === size
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantité */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quantité</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center font-semibold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className={`font-medium ${product.in_stock ? 'text-green-600' : 'text-red-500'}`}>
                  {product.in_stock ? '✓ En stock' : 'Rupture de stock'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={handleAddToCart} disabled={!product.in_stock} className="flex-1 min-w-[200px] btn-primary text-lg py-4">
                <ShoppingBag className="w-6 h-6" />
                <span>Ajouter au panier</span>
              </button>
              <button
                onClick={handleWishlist}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${isWishlisted ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-500 hover:text-red-500'
                  }`}
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500' : ''}`} />
              </button>
              <button onClick={handleShare} className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-all">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {/* Garanties */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              {[
                { icon: Truck, color: 'blue', label: 'Livraison', sub: '24-48h' },
                { icon: Shield, color: 'green', label: 'Garantie', sub: '2 ans' },
                { icon: RefreshCw, color: 'purple', label: 'Retours', sub: '30 jours' },
              ].map(({ icon: Icon, color, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div>
                    <span className="block font-medium text-gray-900">{label}</span>
                    <span className="text-sm text-gray-500">{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Produits similaires */}
        {relatedProducts.length > 0 && (
          <div className="pt-16 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Produits similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(related => {
                const img = related.images?.find(i => i.is_primary) ?? related.images?.[0];
                return (
                  <Link key={related.id} to={`/product/${related.slug}`} className="group card card-hover">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={img?.url_medium ?? img?.url ?? '/placeholder.png'}
                        alt={related.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {related.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">{related.price.toLocaleString()} FCFA</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-600">{related.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
