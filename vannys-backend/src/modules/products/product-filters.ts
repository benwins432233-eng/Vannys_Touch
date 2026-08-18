import { Prisma } from '@prisma/client';

/**
 * Tri et pagination du catalogue, isolés du service pour être testables.
 */

export const PRODUCT_SORTS = ['recent', 'price_asc', 'price_desc', 'name', 'popular'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const AVAILABILITY_FILTERS = ['in_stock', 'out_of_stock'] as const;
export type AvailabilityFilter = (typeof AVAILABILITY_FILTERS)[number];

/** Au-delà, la page devient longue à charger sans rien apporter. */
export const MAX_PER_PAGE = 60;
export const DEFAULT_PER_PAGE = 12;

/**
 * Tri appliqué à la requête.
 *
 * Un second critère sur l'identifiant accompagne chaque tri : deux produits au
 * même prix pouvaient sinon changer de place d'une page à l'autre, et le même
 * article apparaissait deux fois — ou disparaissait.
 */
export const orderByFor = (sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }, { id: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { id: 'asc' }];
    case 'name':
      return [{ name: 'asc' }, { id: 'asc' }];
    case 'popular':
      // « Populaire » se mesure aux ventes, pas à une note que personne ne
      // saisit : le modèle Review existe mais n'est pas encore exploité.
      return [{ orderItems: { _count: 'desc' } }, { id: 'desc' }];
    case 'recent':
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
};

/**
 * Traduit l'ancien couple `sort` + `dir` vers les nouvelles valeurs.
 * Les clients déjà déployés envoient encore `sort=price&dir=asc`.
 */
export const legacySort = (sort?: string, dir?: string): ProductSort | undefined => {
  if (!sort) return undefined;
  const descending = dir !== 'asc';
  if (sort === 'price') return descending ? 'price_desc' : 'price_asc';
  if (sort === 'rating') return 'popular';
  if (sort === 'createdAt') return 'recent';
  return undefined;
};

export const resolveSort = (sort?: string, dir?: string): ProductSort => {
  if (sort && (PRODUCT_SORTS as readonly string[]).includes(sort)) return sort as ProductSort;
  return legacySort(sort, dir) ?? 'recent';
};

/** Nombre d'éléments par page, plafonné et jamais nul. */
export const resolvePerPage = (perPage?: number, legacyLimit?: number): number => {
  const requested = perPage ?? legacyLimit ?? DEFAULT_PER_PAGE;
  if (!Number.isFinite(requested) || requested < 1) return DEFAULT_PER_PAGE;
  return Math.min(Math.trunc(requested), MAX_PER_PAGE);
};

export const resolvePage = (page?: number): number => {
  if (!Number.isFinite(page) || !page || page < 1) return 1;
  return Math.trunc(page);
};

export interface CatalogFilters {
  search?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: AvailabilityFilter;
  featured?: boolean;
}

/** Une variante vendable : active, avec du stock. */
const SELLABLE_VARIANT: Prisma.ProductVariantWhereInput = {
  isActive: true,
  stock: { gt: 0 },
};

/**
 * Construit la clause `where` du catalogue public.
 *
 * `isActive: true` est posé en premier et n'est jamais surchargeable par un
 * paramètre : un produit désactivé ne doit apparaître sous aucune combinaison
 * de filtres.
 */
export const buildProductWhere = (filters: CatalogFilters): Prisma.ProductWhereInput => {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.category) where.category = { slug: filters.category };
  if (filters.featured) where.isFeatured = true;

  if (filters.search) {
    // MySQL ne supporte pas mode:'insensitive' (c'est PostgreSQL) : Prisma
    // rejette l'argument. Les collations utf8mb4_*_ci sont déjà insensibles
    // à la casse.
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
      { reference: { contains: filters.search } },
    ];
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
      ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
    };
  }

  // Taille et couleur portent sur UNE MÊME variante : demander « M » et
  // « Rouge » ne doit pas remonter un produit qui a du M en bleu et du rouge
  // en L. Les deux conditions vivent donc dans le même `some`.
  const variantConditions: Prisma.ProductVariantWhereInput = {};
  if (filters.size) variantConditions.size = filters.size;
  if (filters.color) variantConditions.color = filters.color;

  const wantsInStock = filters.availability === 'in_stock';
  const wantsOutOfStock = filters.availability === 'out_of_stock';

  if (wantsOutOfStock) {
    // Épuisé : aucune variante vendable, en tenant compte de la déclinaison
    // demandée le cas échéant.
    where.NOT = { variants: { some: { ...SELLABLE_VARIANT, ...variantConditions } } };
    if (Object.keys(variantConditions).length) {
      // …mais la déclinaison doit tout de même exister au catalogue.
      where.variants = { some: { isActive: true, ...variantConditions } };
    }
  } else if (Object.keys(variantConditions).length || wantsInStock) {
    where.variants = {
      some: {
        isActive: true,
        ...(wantsInStock && { stock: { gt: 0 } }),
        ...variantConditions,
      },
    };
  }

  return where;
};
