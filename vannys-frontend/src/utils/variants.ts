import type { Product, ProductVariant } from '@/types';

/** Quantité maximale par ligne de panier, indépendamment du stock. */
export const MAX_QUANTITY_PER_LINE = 20;

const norm = (value?: string | null): string | null => value ?? null;

/** Valeurs de taille réellement proposées, dans l'ordre reçu du serveur. */
export const sizesOf = (variants: ProductVariant[]): string[] =>
  [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))];

export const colorsOf = (variants: ProductVariant[]): string[] =>
  [...new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))];

/** Retrouve la combinaison correspondant à la sélection en cours. */
export const findVariant = (
  variants: ProductVariant[],
  color?: string,
  size?: string,
): ProductVariant | undefined => {
  const exact = variants.find(
    (v) => norm(v.color) === norm(color) && norm(v.size) === norm(size),
  );
  if (exact) return exact;

  // Produit sans déclinaison : une variante unique porte tout le stock.
  const [only] = variants;
  if (variants.length === 1 && !only.color && !only.size) return only;
  return undefined;
};

/**
 * Stock restant pour une valeur d'un axe, l'autre axe étant déjà choisi.
 * Sert à griser une taille indisponible dans la couleur sélectionnée plutôt
 * que de laisser la cliente découvrir le problème au moment de commander.
 */
export const stockForOption = (
  variants: ProductVariant[],
  axis: 'size' | 'color',
  value: string,
  otherSelected?: string,
): number =>
  variants
    .filter((v) => {
      if (v[axis] !== value) return false;
      if (otherSelected === undefined) return true;
      const other = axis === 'size' ? v.color : v.size;
      return norm(other) === norm(otherSelected);
    })
    .reduce((sum, v) => sum + v.stock, 0);

/** Le produit se décline-t-il, c'est-à-dire faut-il choisir avant d'ajouter ? */
export const needsSelection = (product: Pick<Product, 'variants'>): boolean =>
  product.variants.some((v) => v.size || v.color);

/** Quantité maximale commandable pour la combinaison choisie. */
export const maxQuantityFor = (variant?: ProductVariant): number =>
  Math.min(variant?.stock ?? 0, MAX_QUANTITY_PER_LINE);
