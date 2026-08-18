import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories.api';
import { ProductCard } from '@/components/products/ProductCard';
import { Button, Card, EmptyState, InputField, SelectField, Skeleton } from '@/components/ui';
import { cn } from '@/utils';
import type { ProductFilters } from '@/types';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const filters: ProductFilters = {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || 'createdAt',
    dir: (searchParams.get('dir') as ProductFilters['dir']) || 'desc',
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

  const hasFilters = filters.category || filters.search || filters.minPrice || filters.maxPrice;

  const categoryName =
    categories?.find((c) => c.slug === filters.category)?.name ?? filters.category;

  return (
    <div className="section">
      <div className="page-container">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Boutique</h1>
            {data && (
              <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
                {data.meta.total} article(s)
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Recherche */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Rechercher un produit"
                placeholder="Rechercher..."
                defaultValue={filters.search}
                onChange={(e) => setParam('search', e.target.value || undefined)}
                className="input pl-9 w-56 py-2.5"
              />
            </div>
            {/* Tri */}
            <select
              aria-label="Trier les produits"
              value={`${filters.sort}-${filters.dir}`}
              onChange={(e) => {
                const [sort, dir] = e.target.value.split('-');
                const next = new URLSearchParams(searchParams);
                next.set('sort', sort);
                next.set('dir', dir);
                next.delete('page');
                setSearchParams(next);
              }}
              className="input w-auto py-2.5"
            >
              <option value="createdAt-desc">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="rating-desc">Mieux notés</option>
            </select>
            {/* Panneau de filtres */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="panneau-filtres"
              leftIcon={<SlidersHorizontal className="w-4 h-4" aria-hidden="true" />}
            >
              Filtres
            </Button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <Card id="panneau-filtres" className="p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField
                label="Catégorie"
                value={filters.category || ''}
                onChange={(e) => setParam('category', e.target.value || undefined)}
              >
                <option value="">Toutes</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <InputField
                label="Prix minimum (FCFA)"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={filters.minPrice}
                onBlur={(e) => setParam('minPrice', e.target.value || undefined)}
              />
              <InputField
                label="Prix maximum (FCFA)"
                type="number"
                min={0}
                placeholder="Sans limite"
                defaultValue={filters.maxPrice}
                onBlur={(e) => setParam('maxPrice', e.target.value || undefined)}
              />
            </div>
          </Card>
        )}

        {/* Filtres actifs */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {filters.category && (
              <FilterChip label={categoryName ?? ''} onRemove={() => setParam('category', undefined)} />
            )}
            {filters.search && (
              <FilterChip
                label={`« ${filters.search} »`}
                onRemove={() => setParam('search', undefined)}
              />
            )}
            {filters.minPrice !== undefined && (
              <FilterChip
                label={`À partir de ${filters.minPrice} FCFA`}
                onRemove={() => setParam('minPrice', undefined)}
              />
            )}
            {filters.maxPrice !== undefined && (
              <FilterChip
                label={`Jusqu'à ${filters.maxPrice} FCFA`}
                onRemove={() => setParam('maxPrice', undefined)}
              />
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Effacer tout
            </Button>
          </div>
        )}

        {/* Grille */}
        {isLoading ? (
          <div role="status" aria-busy="true">
            <span className="sr-only">Chargement des produits</span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-[3/4]" />
              ))}
            </div>
          </div>
        ) : data?.data.length === 0 ? (
          <EmptyState
            icon={<Search className="w-10 h-10" />}
            title="Aucun produit trouvé"
            description="Essayez de modifier vos filtres ou votre recherche."
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {data?.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.lastPage > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
            {Array.from({ length: data.meta.lastPage }, (_, i) => i + 1).map((p) => {
              const current = p === filters.page;
              return (
                <button
                  key={p}
                  type="button"
                  aria-label={`Page ${p}`}
                  aria-current={current ? 'page' : undefined}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set('page', String(p));
                    setSearchParams(next);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    'w-9 h-9 rounded-token text-sm font-medium transition-colors',
                    current
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-foreground hover:bg-muted',
                  )}
                >
                  {p}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

/** Puce de filtre actif, retirable individuellement (§4.6). */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-accent/20 text-foreground text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer le filtre ${label}`}
        className="p-0.5 rounded-full transition-colors hover:bg-foreground/10"
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>
    </span>
  );
}
