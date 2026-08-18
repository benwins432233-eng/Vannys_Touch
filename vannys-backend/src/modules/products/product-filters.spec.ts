import {
  buildProductWhere,
  legacySort,
  MAX_PER_PAGE,
  resolvePage,
  resolvePerPage,
  resolveSort,
} from './product-filters';

describe('buildProductWhere', () => {
  it('exige toujours isActive, quels que soient les filtres', () => {
    // Un produit désactivé ne doit apparaître sous aucune combinaison de filtres.
    expect(buildProductWhere({})).toMatchObject({ isActive: true });
    expect(buildProductWhere({ search: 'robe' })).toMatchObject({ isActive: true });
    expect(buildProductWhere({ availability: 'out_of_stock' })).toMatchObject({ isActive: true });
  });

  it('recherche le nom, la description et la référence', () => {
    const where = buildProductWhere({ search: 'robe' });
    expect(where.OR).toEqual([
      { name: { contains: 'robe' } },
      { description: { contains: 'robe' } },
      { reference: { contains: 'robe' } },
    ]);
  });

  it('filtre par catégorie via le slug', () => {
    expect(buildProductWhere({ category: 'robes' })).toMatchObject({
      category: { slug: 'robes' },
    });
  });

  it('combine un prix minimum et maximum', () => {
    expect(buildProductWhere({ minPrice: 1000, maxPrice: 5000 }).price).toEqual({
      gte: 1000,
      lte: 5000,
    });
  });

  it('accepte un prix minimum seul', () => {
    expect(buildProductWhere({ minPrice: 1000 }).price).toEqual({ gte: 1000 });
  });

  it('exige la taille ET la couleur sur la MÊME variante', () => {
    // Un produit qui a du M en bleu et du rouge en L ne doit pas remonter
    // pour une recherche "M rouge" : les deux conditions doivent porter sur
    // la même ligne de variante, pas sur deux lignes différentes.
    const where = buildProductWhere({ size: 'M', color: 'Rouge' });
    expect(where.variants).toEqual({
      some: { isActive: true, size: 'M', color: 'Rouge' },
    });
  });

  it('ne montre que les produits en stock avec availability=in_stock', () => {
    const where = buildProductWhere({ availability: 'in_stock' });
    expect(where.variants).toEqual({
      some: { isActive: true, stock: { gt: 0 } },
    });
  });

  it('ne montre que les produits épuisés avec availability=out_of_stock', () => {
    const where = buildProductWhere({ availability: 'out_of_stock' });
    expect(where.NOT).toEqual({
      variants: { some: { isActive: true, stock: { gt: 0 } } },
    });
    expect(where.variants).toBeUndefined();
  });

  it('combine épuisé avec une déclinaison précise', () => {
    // "M épuisé" : la taille M doit exister au catalogue, mais sans stock.
    const where = buildProductWhere({ size: 'M', availability: 'out_of_stock' });
    expect(where.NOT).toEqual({
      variants: { some: { isActive: true, stock: { gt: 0 }, size: 'M' } },
    });
    expect(where.variants).toEqual({ some: { isActive: true, size: 'M' } });
  });

  it("n'ajoute aucune condition de variante sans filtre de déclinaison ni disponibilité", () => {
    expect(buildProductWhere({}).variants).toBeUndefined();
    expect(buildProductWhere({}).NOT).toBeUndefined();
  });
});

describe('resolveSort', () => {
  it('accepte directement les nouvelles valeurs', () => {
    expect(resolveSort('price_asc')).toBe('price_asc');
    expect(resolveSort('popular')).toBe('popular');
  });

  it('traduit les anciennes valeurs sort+dir', () => {
    expect(resolveSort('price', 'asc')).toBe('price_asc');
    expect(resolveSort('price', 'desc')).toBe('price_desc');
    expect(resolveSort('rating', 'desc')).toBe('popular');
    expect(resolveSort('createdAt', 'desc')).toBe('recent');
  });

  it('retombe sur "recent" sans aucune valeur', () => {
    expect(resolveSort(undefined, undefined)).toBe('recent');
  });

  it('retombe sur "recent" pour une valeur inconnue', () => {
    expect(resolveSort('n_importe_quoi')).toBe('recent');
  });
});

describe('legacySort', () => {
  it('traite l’absence de sens de tri comme décroissant', () => {
    expect(legacySort('price', undefined)).toBe('price_desc');
  });

  it('renvoie undefined sans clé de tri', () => {
    expect(legacySort(undefined, 'asc')).toBeUndefined();
  });
});

describe('resolvePerPage', () => {
  it('plafonne à 60 quelle que soit la demande', () => {
    expect(resolvePerPage(500)).toBe(MAX_PER_PAGE);
  });

  it('accepte l’ancien paramètre limit en absence de perPage', () => {
    expect(resolvePerPage(undefined, 24)).toBe(24);
  });

  it('retombe sur la valeur par défaut si négatif ou non fini', () => {
    expect(resolvePerPage(-5)).toBe(12);
    expect(resolvePerPage(Number.NaN)).toBe(12);
  });

  it('tronque une valeur décimale', () => {
    expect(resolvePerPage(12.9)).toBe(12);
  });
});

describe('resolvePage', () => {
  it('retombe sur la page 1 si absente, nulle ou négative', () => {
    expect(resolvePage(undefined)).toBe(1);
    expect(resolvePage(0)).toBe(1);
    expect(resolvePage(-3)).toBe(1);
  });

  it('conserve une page valide', () => {
    expect(resolvePage(4)).toBe(4);
  });
});
