/**
 * Disponibilité d'un produit — dérivée du stock de ses variantes.
 *
 * Le booléen `products.in_stock` a été supprimé par la migration
 * `2_variant_stock` : une disponibilité saisie à la main et un stock réel
 * finissent toujours par diverger. L'API continue d'exposer `inStock`, mais
 * comme une valeur calculée ici, jamais comme une colonne.
 */

export type Availability = 'available' | 'low_stock' | 'out_of_stock' | 'disabled';

interface VariantStock {
  stock: number;
  isActive: boolean;
}

interface ProductStockInput {
  isActive: boolean;
  lowStockThreshold: number;
  variants?: VariantStock[];
}

/** Somme des stocks des seules variantes actives. */
export const totalStockOf = (variants: VariantStock[] = []): number =>
  variants.filter((v) => v.isActive).reduce((sum, v) => sum + v.stock, 0);

export const availabilityOf = (product: ProductStockInput): Availability => {
  if (!product.isActive) return 'disabled';

  const total = totalStockOf(product.variants);
  if (total <= 0) return 'out_of_stock';
  if (total <= product.lowStockThreshold) return 'low_stock';
  return 'available';
};

/**
 * Ajoute `totalStock`, `availability` et `inStock` au produit renvoyé par l'API.
 * `inStock` est conservé pour ne pas casser les clients déjà déployés (§2.9).
 */
export const withAvailability = <T extends ProductStockInput>(product: T) => {
  const availability = availabilityOf(product);
  return {
    ...product,
    totalStock: totalStockOf(product.variants),
    availability,
    inStock: availability === 'available' || availability === 'low_stock',
  };
};
