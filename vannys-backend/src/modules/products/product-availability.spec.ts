import { availabilityOf, totalStockOf, withAvailability } from './product-availability';

const variant = (stock: number, isActive = true) => ({ stock, isActive });

describe('totalStockOf', () => {
  it('additionne les stocks des variantes actives', () => {
    expect(totalStockOf([variant(2), variant(3)])).toBe(5);
  });

  it('ignore les variantes désactivées', () => {
    // Une variante retirée de la vente ne doit plus rendre le produit disponible.
    expect(totalStockOf([variant(2), variant(99, false)])).toBe(2);
  });

  it('vaut zéro sans variante', () => {
    expect(totalStockOf([])).toBe(0);
    expect(totalStockOf()).toBe(0);
  });
});

describe('availabilityOf', () => {
  const product = (variants: { stock: number; isActive: boolean }[], overrides = {}) => ({
    isActive: true,
    lowStockThreshold: 3,
    variants,
    ...overrides,
  });

  it('signale un produit désactivé avant toute autre chose', () => {
    expect(availabilityOf(product([variant(50)], { isActive: false }))).toBe('disabled');
  });

  it('signale un produit épuisé quand tout le stock est à zéro', () => {
    expect(availabilityOf(product([variant(0), variant(0)]))).toBe('out_of_stock');
  });

  it('signale un stock faible au niveau du seuil, pas seulement en dessous', () => {
    expect(availabilityOf(product([variant(3)]))).toBe('low_stock');
    expect(availabilityOf(product([variant(1)]))).toBe('low_stock');
  });

  it('signale un produit disponible au-delà du seuil', () => {
    expect(availabilityOf(product([variant(4)]))).toBe('available');
  });

  it("traite un produit sans variante comme épuisé, pas comme disponible", () => {
    expect(availabilityOf(product([]))).toBe('out_of_stock');
  });
});

describe('withAvailability', () => {
  it('expose encore inStock aux clients déjà déployés', () => {
    const disponible = withAvailability({
      isActive: true,
      lowStockThreshold: 3,
      variants: [variant(10)],
    });
    expect(disponible.inStock).toBe(true);
    expect(disponible.totalStock).toBe(10);

    const epuise = withAvailability({
      isActive: true,
      lowStockThreshold: 3,
      variants: [variant(0)],
    });
    expect(epuise.inStock).toBe(false);
  });

  it('considère un stock faible comme encore commandable', () => {
    const faible = withAvailability({
      isActive: true,
      lowStockThreshold: 3,
      variants: [variant(1)],
    });
    expect(faible.availability).toBe('low_stock');
    expect(faible.inStock).toBe(true);
  });
});
