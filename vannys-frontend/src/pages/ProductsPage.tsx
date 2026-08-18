import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCatalogFilters, useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/ProductCard';
import {
  Button,
  Drawer,
  EmptyState,
  SelectField,
  Skeleton,
} from '@/components/ui';
import { cn } from '@/utils';
import type { AvailabilityFilter, ProductFilters, ProductSort } from '@/types';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'popular', label: 'Les plus vendus' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom (A → Z)' },
];

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: 'in_stock', label: 'En stock' },
  { value: 'out_of_stock', label: 'Épuisé' },
];

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const filters: ProductFilters = {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    size: searchParams.get('size') || undefined,
    color: searchParams.get('color') || undefined,
    availability: (searchParams.get('availability') as AvailabilityFilter) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as ProductSort) || 'recent',
    page: Number(searchParams.get('page') || 1),
    perPage: 12,
  };

  const { data, isLoading } = useProducts(filters);
  const { data: catalog } = useCatalogFilters();

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  /** Bascule : cliquer sur la valeur déjà sélectionnée la retire. */
  const toggleParam = (key: string, value: string) =>
    setParam(key, searchParams.get(key) === value ? undefined : value);

  const clearFilters = () => setSearchParams({});

  const hasFilters = Boolean(
    filters.category ||
      filters.search ||
      filters.size ||
      filters.color ||
      filters.availability ||
      filters.minPrice ||
      filters.maxPrice,
  );

  const categoryName =
    catalog?.categories.find((c) => c.slug === filters.category)?.name ?? filters.category;

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
              value={filters.sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input w-auto py-2.5"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {/* Panneau de filtres */}
            <Button
              variant={hasFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(true)}
              aria-haspopup="dialog"
              leftIcon={<SlidersHorizontal className="w-4 h-4" aria-hidden="true" />}
            >
              Filtres
            </Button>
          </div>
        </div>

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
            {filters.size && (
              <FilterChip label={`Taille ${filters.size}`} onRemove={() => setParam('size', undefined)} />
            )}
            {filters.color && (
              <FilterChip
                label={`Couleur ${filters.color}`}
                onRemove={() => setParam('color', undefined)}
              />
            )}
            {filters.availability && (
              <FilterChip
                label={AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability)?.label ?? ''}
                onRemove={() => setParam('availability', undefined)}
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

      {/* Panneau de filtres — tiroir, y compris sur ordinateur : les mêmes
          contrôles servent sur tous les formats, sans dupliquer le balisage
          entre un panneau en ligne et un tiroir mobile. */}
      <Drawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtrer les produits"
        description="Affinez le catalogue par catégorie, taille, couleur, disponibilité ou budget."
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" className="flex-1" onClick={clearFilters}>
              Tout effacer
            </Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>
              Voir {data?.meta.total ?? ''} résultat(s)
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <SelectField
            label="Catégorie"
            value={filters.category || ''}
            onChange={(e) => setParam('category', e.target.value || undefined)}
          >
            <option value="">Toutes</option>
            {catalog?.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.productCount})
              </option>
            ))}
          </SelectField>

          {!!catalog?.sizes.length && (
            <fieldset>
              <legend className="label mb-2">Taille</legend>
              <div className="flex flex-wrap gap-2">
                {catalog.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={filters.size === size}
                    onClick={() => toggleParam('size', size)}
                    className={cn(
                      'min-w-11 h-11 px-3 rounded-token border-2 text-sm font-medium transition-colors',
                      filters.size === size
                        ? 'border-accent bg-accent/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-accent/60 hover:text-foreground',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {!!catalog?.colors.length && (
            <fieldset>
              <legend className="label mb-2">Couleur</legend>
              <div className="flex flex-wrap gap-2">
                {catalog.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={filters.color === color}
                    onClick={() => toggleParam('color', color)}
                    className={cn(
                      'px-3 h-11 rounded-token border-2 text-sm transition-colors',
                      filters.color === color
                        ? 'border-accent bg-accent/10 text-foreground font-medium'
                        : 'border-border text-muted-foreground hover:border-accent/60 hover:text-foreground',
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="label mb-2">Disponibilité</legend>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filters.availability === option.value}
                  onClick={() => toggleParam('availability', option.value)}
                  className={cn(
                    'px-3 h-11 rounded-token border-2 text-sm transition-colors',
                    filters.availability === option.value
                      ? 'border-accent bg-accent/10 text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:border-accent/60 hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label mb-2">
              Budget (FCFA){' '}
              {!!catalog?.priceRange.max && (
                <span className="text-muted-foreground font-normal">
                  — de {catalog.priceRange.min.toLocaleString('fr-FR')} à{' '}
                  {catalog.priceRange.max.toLocaleString('fr-FR')}
                </span>
              )}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                aria-label="Prix minimum"
                placeholder="Min"
                defaultValue={filters.minPrice}
                onBlur={(e) => setParam('minPrice', e.target.value || undefined)}
                className="input"
              />
              <input
                type="number"
                min={0}
                aria-label="Prix maximum"
                placeholder="Max"
                defaultValue={filters.maxPrice}
                onBlur={(e) => setParam('maxPrice', e.target.value || undefined)}
                className="input"
              />
            </div>
          </fieldset>
        </div>
      </Drawer>
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
