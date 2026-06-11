// ============================================================
// src/pages/Shop.tsx — VERSION API
// ============================================================
import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search, Filter, ShoppingBag, Star,
  Grid3X3, LayoutList, ChevronDown, X, Loader2
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/hooks/useCart';
import type { Product, ProductFilters } from '@/types';

// ---- Composant carte produit (réutilisable) ----
function ProductCard({ product, onAddToCart, view }: {
  product: Product;
  onAddToCart: (p: Product) => void;
  view: 'grid' | 'list';
}) {
  const primaryImage = product.images?.find(i => i.is_primary) ?? product.images?.[0];
  const imageUrl = primaryImage?.url_medium ?? primaryImage?.url ?? '/placeholder.png';

  if (view === 'list') {
    return (
      <div className="flex gap-6 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
        <Link to={`/product/${product.slug}`} className="w-48 h-48 flex-shrink-0">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
        </Link>
        <div className="flex-1 py-2">
          <Link to={`/product/${product.slug}`}>
            <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
              {product.category?.name}
            </span>
            <h3 className="font-semibold text-xl text-gray-900 mt-1 mb-2 hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          <Stars rating={product.rating} count={product.reviews_count} />
          <div className="flex items-center justify-between mt-4">
            <PriceDisplay price={product.price} originalPrice={product.original_price} size="lg" />
            <button onClick={() => onAddToCart(product)} className="btn-primary">
              <ShoppingBag className="w-5 h-5" />
              <span>Ajouter au panier</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover group">
      <div className="relative h-56 overflow-hidden">
        <Link to={`/product/${product.slug}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        {product.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
            {product.badge}
          </span>
        )}
        <button
          onClick={() => onAddToCart(product)}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-600 hover:text-white"
        >
          <ShoppingBag className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <Link to={`/product/${product.slug}`}>
          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
            {product.category?.name}
          </span>
          <h3 className="font-semibold text-gray-900 mt-1 mb-2 line-clamp-1 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <Stars rating={product.rating} count={product.reviews_count} />
        <div className="mt-3">
          <PriceDisplay price={product.price} originalPrice={product.original_price} />
        </div>
      </div>
    </div>
  );
}

// ---- Sous-composants partagés ----
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
      </div>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  );
}

function PriceDisplay({ price, originalPrice, size = 'sm' }: {
  price: number; originalPrice?: number | null; size?: 'sm' | 'lg';
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-gray-900 ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
        {price.toLocaleString()} FCFA
      </span>
      {originalPrice && (
        <span className={`text-gray-400 line-through ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
          {originalPrice.toLocaleString()}
        </span>
      )}
    </div>
  );
}

// ---- Page principale ----
export default function Shop() {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const { addToCart } = useCart();
  const { categories } = useCategories();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categorySlug ?? 'all');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [sort, setSort] = useState<ProductFilters['sort']>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filters: ProductFilters = {
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
    ...(search && { search }),
    max_price: maxPrice,
    sort,
    page,
    per_page: 12,
  };

  const { products, pagination, loading, error } = useProducts(filters);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
  }, [addToCart]);

  const currentCategory = categories.find(c => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 animate-fadeIn">
      {/* Hero */}
      <div className="relative h-64 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {currentCategory ? currentCategory.name : 'Tous nos produits'}
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            {currentCategory?.description ?? 'Découvrez notre sélection complète de produits de qualité'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre filtres */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="relative min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none appearance-none bg-white"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[180px]">
              <select
                value={sort}
                onChange={e => setSortBy(e.target.value as ProductFilters['sort'])}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none appearance-none bg-white"
              >
                <option value="default">En vedette</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
                <option value="newest">Nouveautés</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex gap-2">
              {(['grid', 'list'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-3 rounded-xl transition-all ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {mode === 'grid' ? <Grid3X3 className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden p-3 rounded-xl bg-gray-100 text-gray-600"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {isFilterOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
              <span className="text-gray-600">Prix max :</span>
              <input
                type="range" min="0" max="200000" step="5000"
                value={maxPrice}
                onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                className="flex-1 max-w-xs"
              />
              <span className="text-gray-900 font-medium">{maxPrice.toLocaleString()} FCFA</span>
            </div>
          )}
        </div>

        {/* Résultats */}
        {pagination && (
          <p className="text-gray-600 mb-6">
            {pagination.total} produit{pagination.total !== 1 ? 's' : ''} trouvé{pagination.total !== 1 ? 's' : ''}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}

        {/* Grille produits */}
        {!loading && !error && products.length > 0 && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {products.map((product, index) => (
              <div key={product.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                <ProductCard product={product} onAddToCart={handleAddToCart} view={viewMode} />
              </div>
            ))}
          </div>
        )}

        {/* Vide */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all'); setMaxPrice(200000); setPage(1); }}
              className="btn-primary mt-4"
            >
              <X className="w-5 h-5" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl font-medium transition-all ${p === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Fix missing setSortBy alias
function setSortBy(value: ProductFilters['sort']) {
  // handled inline via useState
}
