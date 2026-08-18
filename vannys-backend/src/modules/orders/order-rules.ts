/**
 * Règles de calcul d'une commande, isolées du service pour être testables
 * sans base de données. Elles décident de montants et de disponibilité :
 * ce sont exactement les endroits où une régression coûte cher.
 */

export interface SellableVariant {
  id: bigint;
  size: string | null;
  color: string | null;
  stock: number;
}

/**
 * Retrouve la combinaison commandée parmi les variantes actives d'un produit.
 *
 * Un produit qui ne se décline pas garde une variante unique (taille et couleur
 * nulles) : elle porte son stock, et on l'accepte quelle que soit la
 * déclinaison envoyée par un client déjà déployé.
 */
export const findVariant = (
  variants: SellableVariant[],
  color?: string | null,
  size?: string | null,
): SellableVariant | undefined => {
  const exact = variants.find(
    (v) => (v.color ?? null) === (color ?? null) && (v.size ?? null) === (size ?? null),
  );
  if (exact) return exact;

  if (variants.length === 1 && variants[0].color === null && variants[0].size === null) {
    return variants[0];
  }
  return undefined;
};

/**
 * Frais de livraison : gratuits à partir du seuil, inclus.
 * Le montant vient du serveur et de lui seul — jamais du client (§2.3).
 */
export const shippingFeeFor = (subtotal: number, threshold: number, fee: number): number =>
  subtotal >= threshold ? 0 : fee;
