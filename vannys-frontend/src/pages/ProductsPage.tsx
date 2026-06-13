import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories.api';
import { ProductCard } from '@/components/products/ProductCard';
import type { ProductFilters } from '@/types';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const filters: ProductFilters = {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as any) || 'createdAt',
    dir: (searchParams.get('dir') as any) || 'desc',
    page: Number(searchParams.get('page') || 1),
    limit: 12,
  };

  const { data, isLoading } = useProducts(filters);
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters =
    filters.category || filters.search || filters.minPrice || filters.maxPrice;

  return (
    <div className="section">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Boutique</h1>
            {data && (
              <p className="text-sm text-gray-500 mt-1">{data.meta.total} article(s)</p>
            )}
          </div>
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                defaultValue={filters.search}
                onChange={(e) => setParam('search', e.target.value || undefined)}
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 w-56"
                style={{ '--tw-ring-color': 'var(--color-gold)' } as any}
              />
            </div>
            {/* Sort */}
            <select
              value={`${filters.sort}-${filters.dir}`}
              onChange={(e) => {
                const [sort, dir] = e.target.value.split('-');
                setParam('sort', sort);
                setParam('dir', dir);
              }}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none bg-white"
            >
              <option value="createdAt-desc">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="rating-desc">Mieux notés</option>
            </select>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="label">Catégorie</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setParam('category', e.target.value || undefined)}
                  className="input"
                >
                  <option value="">Toutes</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* Price range */}
              <div>
                <label className="label">Prix minimum (FCFA)</label>
                <input
                  type="number"
                  placeholder="0"
                  defaultValue={filters.minPrice}
                  onBlur={(e) => setParam('minPrice', e.target.value || undefined)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Prix maximum (FCFA)</label>
                <input
                  type="number"
                  placeholder="Sans limite"
                  defaultValue={filters.maxPrice}
                  onBlur={(e) => setParam('maxPrice', e.target.value || undefined)}
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active filters */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.category && (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full">
                {categories?.find((c) => c.slug === filters.category)?.name ?? filters.category}
                <button onClick={() => setParam('category', undefined)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.search && (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full">
                "{filters.search}"
                <button onClick={() => setParam('search', undefined)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-700 underline">
              Effacer tout
            </button>
          </div>
        )}

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="font-medium text-gray-600">Aucun produit trouvé</p>
            <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
            <button onClick={clearFilters} className="btn-outline mt-4 text-sm py-2">
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {data?.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.lastPage > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: data.meta.lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(p));
                  setSearchParams(next);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  p === filters.page
                    ? 'text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                style={p === filters.page ? { background: 'var(--color-gold)' } : {}}
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
