import { findVariant, shippingFeeFor } from './order-rules';
import type { SellableVariant } from './order-rules';

const v = (
  id: number,
  { size = null, color = null, stock = 5 }: Partial<Omit<SellableVariant, 'id'>> = {},
): SellableVariant => ({ id: BigInt(id), size, color, stock });

describe('findVariant', () => {
  const variants = [
    v(1, { size: 'M', color: 'Rouge' }),
    v(2, { size: 'L', color: 'Rouge' }),
    v(3, { size: 'M', color: 'Bleu' }),
  ];

  it('retrouve la combinaison exacte', () => {
    expect(findVariant(variants, 'Bleu', 'M')?.id).toBe(BigInt(3));
  });

  it('refuse une combinaison qui n’est pas proposée', () => {
    expect(findVariant(variants, 'Bleu', 'L')).toBeUndefined();
  });

  it('refuse une déclinaison incomplète quand le produit se décline', () => {
    // Sans taille, impossible de savoir quel stock décrémenter.
    expect(findVariant(variants, 'Rouge')).toBeUndefined();
  });

  it('accepte n’importe quelle déclinaison pour un produit qui ne se décline pas', () => {
    // Cas des clients déjà déployés qui envoient encore une couleur libre.
    const unique = [v(9)];
    expect(findVariant(unique)?.id).toBe(BigInt(9));
    expect(findVariant(unique, 'Rouge', 'M')?.id).toBe(BigInt(9));
  });

  it('ne confond pas une variante nulle avec une chaîne vide', () => {
    const uniques = [v(1, { size: 'M' }), v(2)];
    expect(findVariant(uniques, undefined, 'M')?.id).toBe(BigInt(1));
    expect(findVariant(uniques, null, null)?.id).toBe(BigInt(2));
  });
});

describe('shippingFeeFor', () => {
  it('facture la livraison en dessous du seuil', () => {
    expect(shippingFeeFor(49_999, 50_000, 2_500)).toBe(2_500);
  });

  it('offre la livraison au seuil exact', () => {
    // La promesse affichée est « dès 50 000 FCFA » : le seuil est inclus.
    expect(shippingFeeFor(50_000, 50_000, 2_500)).toBe(0);
  });

  it('offre la livraison au-delà du seuil', () => {
    expect(shippingFeeFor(120_000, 50_000, 2_500)).toBe(0);
  });

  it('facture la livraison sur un panier vide', () => {
    expect(shippingFeeFor(0, 50_000, 2_500)).toBe(2_500);
  });
});
