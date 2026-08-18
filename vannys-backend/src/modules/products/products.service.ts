import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
  ProductVariantDto,
} from './dto/product.dto';
import { withAvailability } from './product-availability';
import {
  buildProductWhere,
  orderByFor,
  resolvePage,
  resolvePerPage,
  resolveSort,
} from './product-filters';
import slugify from 'slugify';

//Convertir les types string en bigInt
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

/** Ordre d'affichage des tailles usuelles ; les autres suivent, par ordre alphabétique. */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];

const compareSizes = (a: string, b: string): number => {
  const indexA = SIZE_ORDER.indexOf(a.toUpperCase());
  const indexB = SIZE_ORDER.indexOf(b.toUpperCase());
  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  // Tailles numériques (36, 38, 40…) : comparer les nombres, pas les chaînes.
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
  return a.localeCompare(b, 'fr');
};

/** Stock attribué à un produit créé sans variante par un client déjà déployé. */
const DEFAULT_LEGACY_STOCK = 10;

/** Référence lisible dérivée de l'identifiant : stable et unique par construction. */
const referenceFor = (id: bigint): string => `PRD-${String(id).padStart(5, '0')}`;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(filters: ProductFilterDto) {
    const sort = resolveSort(filters.sort, filters.dir);
    const perPage = resolvePerPage(filters.perPage, filters.limit);
    const page = resolvePage(filters.page);
    const where = buildProductWhere(filters);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: orderByFor(sort),
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          // Le catalogue public ne montre que les combinaisons encore vendables.
          variants: { where: { isActive: true }, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map(withAvailability),
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
        sort,
        // `limit` est conservé le temps d'une version : des clients déjà
        // déployés lisent encore ce champ pour paginer.
        limit: perPage,
      },
    };
  }

  /**
   * Valeurs de filtre réellement disponibles.
   *
   * Construites depuis le catalogue actif, jamais depuis une liste figée :
   * proposer une taille que plus aucun produit ne porte mène la cliente vers
   * un résultat vide qu'elle ne comprend pas.
   */
  async findFilters() {
    const activeProducts = { isActive: true };

    const [categories, variants, priceBounds] = await Promise.all([
      this.prisma.category.findMany({
        where: { isActive: true, products: { some: activeProducts } },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: { where: activeProducts } } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.productVariant.findMany({
        where: { isActive: true, product: activeProducts },
        select: { size: true, color: true },
        distinct: ['size', 'color'],
      }),
      this.prisma.product.aggregate({
        where: activeProducts,
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    const sizes = [...new Set(variants.map((v) => v.size).filter((v): v is string => !!v))];
    const colors = [...new Set(variants.map((v) => v.color).filter((v): v is string => !!v))];

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        productCount: category._count.products,
      })),
      // Les tailles suivent l'ordre des vêtements, pas l'alphabet : « L, M, S »
      // n'a aucun sens pour une cliente.
      sizes: sizes.sort(compareSizes),
      colors: colors.sort((a, b) => a.localeCompare(b, 'fr')),
      priceRange: {
        min: Number(priceBounds._min.price ?? 0),
        max: Number(priceBounds._max.price ?? 0),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true }, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        reviews: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return withAvailability(product);
  }

  /** Vue administration : les variantes désactivées restent visibles. */
  async findById(id: string | bigint) {
    const product = await this.prisma.product.findUnique({
      where: { id: toId(id) },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return withAvailability(product);
  }

  async create(dto: CreateProductDto, imageFiles: Express.Multer.File[]) {
    const slug = await this.generateUniqueSlug(dto.name);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        reference: '', // remplacée juste après : la référence dérive de l'id
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice || null,
        categoryId: toId(dto.categoryId),
        badge: dto.badge || null,
        lowStockThreshold: dto.lowStockThreshold ?? 3,
        isFeatured: dto.isFeatured ?? false,
      },
    });

    await this.prisma.product.update({
      where: { id: product.id },
      data: { reference: referenceFor(product.id) },
    });

    // Upload images
    if (imageFiles?.length) {
      await this.uploadImages(product.id, imageFiles);
    }

    await this.syncVariants(product.id, this.resolveVariants(dto));

    return this.findById(product.id);
  }

  async update(id: string, dto: UpdateProductDto, imageFiles?: Express.Multer.File[]) {
    const numericId = toId(id);
    await this.findById(numericId);

    const data: any = {};
    const fields = [
      'name',
      'description',
      'price',
      'originalPrice',
      'categoryId',
      'badge',
      'lowStockThreshold',
      'isFeatured',
      'isActive',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined) data[f] = dto[f] === '' ? null : dto[f];
    }
    if (dto.name) {
      data.slug = await this.generateUniqueSlug(dto.name, numericId);
    }

    await this.prisma.product.update({ where: { id: numericId }, data });

    if (imageFiles?.length) {
      await this.uploadImages(numericId, imageFiles);
    }

    if (dto.variants !== undefined || dto.colors !== undefined || dto.sizes !== undefined) {
      await this.syncVariants(numericId, this.resolveVariants(dto));
    }

    return this.findById(numericId);
  }

  async remove(id: string) {
    const numericId = toId(id);
    const product = await this.findById(numericId);

    // Delete Cloudinary images
    for (const image of product.images) {
      await this.cloudinary.deleteByPublicId(image.cloudinaryId).catch(() => null);
    }

    await this.prisma.product.delete({ where: { id: numericId } });
    return { message: 'Product deleted' };
  }

  async deleteImage(imageId: string) {
    const numericImageId = toId(imageId);
    const image = await this.prisma.productImage.findUnique({ where: { id: numericImageId } });
    if (!image) throw new NotFoundException('Image not found');

    await this.cloudinary.deleteByPublicId(image.cloudinaryId).catch(() => null);
    await this.prisma.productImage.delete({ where: { id: numericImageId } });

    // If deleted image was primary, promote the next one
    const remaining = await this.prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: 'asc' },
    });
    if (remaining && image.isPrimary) {
      await this.prisma.productImage.update({ where: { id: remaining.id }, data: { isPrimary: true } });
    }

    return { message: 'Image deleted' };
  }

  async setPrimaryImage(imageId: string) {
    const numericBingImageId = toId(imageId);
    const image = await this.prisma.productImage.findUnique({ where: { id: numericBingImageId } });
    if (!image) throw new NotFoundException('Image not found');

    // Reset all
    await this.prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    });
    // Set new primary
    return this.prisma.productImage.update({ where: { id: numericBingImageId }, data: { isPrimary: true } });
  }

  // ─── Private helpers ─────────────────────────────────────────

  /**
   * Traduit la charge utile reçue en liste de combinaisons vendables.
   *
   * `variants` est la forme actuelle. `colors`/`sizes`, encore acceptés pour les
   * clients déjà déployés, sont combinés en produit cartésien : c'est ce que
   * l'ancien modèle laissait entendre sans jamais le matérialiser.
   */
  private resolveVariants(dto: CreateProductDto | UpdateProductDto): ProductVariantDto[] {
    if (dto.variants?.length) {
      return dto.variants.map((v) => ({
        size: v.size?.trim() || undefined,
        color: v.color?.trim() || undefined,
        stock: v.stock ?? 0,
        sku: v.sku?.trim() || undefined,
        isActive: v.isActive ?? true,
      }));
    }

    const colors = (dto.colors ?? []).filter(Boolean).map((c) => c.trim());
    const sizes = (dto.sizes ?? []).filter(Boolean).map((s) => s.trim());

    // Sans variante déclarée, le produit reste vendable via une combinaison
    // unique ; `inStock` (déprécié) ne sert plus qu'à lui donner un stock initial.
    if (!colors.length && !sizes.length) {
      if (dto.variants === undefined && dto.colors === undefined && dto.sizes === undefined) {
        return [];
      }
      return [{ stock: dto.inStock === false ? 0 : DEFAULT_LEGACY_STOCK, isActive: true }];
    }

    if (!sizes.length) {
      return colors.map((color) => ({ color, stock: 0, isActive: true }));
    }
    if (!colors.length) {
      return sizes.map((size) => ({ size, stock: 0, isActive: true }));
    }
    return colors.flatMap((color) => sizes.map((size) => ({ color, size, stock: 0, isActive: true })));
  }

  /**
   * Aligne les variantes du produit sur la liste reçue.
   *
   * Une combinaison absente de la liste n'est jamais supprimée si elle a déjà
   * été commandée : elle est désactivée, sinon l'historique des commandes
   * perdrait sa référence. Une combinaison existante conserve son identifiant,
   * pour que les paniers en cours continuent de pointer sur la bonne ligne.
   */
  private async syncVariants(productId: bigint, variants: ProductVariantDto[]) {
    const key = (v: { size?: string | null; color?: string | null }) =>
      `${v.size ?? ''}::${v.color ?? ''}`;

    const existing = await this.prisma.productVariant.findMany({ where: { productId } });
    const existingByKey = new Map(existing.map((v) => [key(v), v]));
    const wantedKeys = new Set(variants.map(key));

    await this.prisma.$transaction(async (tx) => {
      for (const variant of variants) {
        const current = existingByKey.get(key(variant));
        const data = {
          size: variant.size ?? null,
          color: variant.color ?? null,
          stock: variant.stock,
          sku: variant.sku ?? null,
          isActive: variant.isActive ?? true,
        };

        if (current) {
          await tx.productVariant.update({ where: { id: current.id }, data });
        } else {
          await tx.productVariant.create({ data: { productId, ...data } });
        }
      }

      const removed = existing.filter((v) => !wantedKeys.has(key(v)));
      if (!removed.length) return;

      const ordered = await tx.orderItem.findMany({
        where: {
          productId,
          OR: removed.map((v) => ({ variantSize: v.size, variantColor: v.color })),
        },
        select: { variantSize: true, variantColor: true },
      });
      const orderedKeys = new Set(
        ordered.map((i) => key({ size: i.variantSize, color: i.variantColor })),
      );

      const toDisable = removed.filter((v) => orderedKeys.has(key(v))).map((v) => v.id);
      const toDelete = removed.filter((v) => !orderedKeys.has(key(v))).map((v) => v.id);

      if (toDisable.length) {
        await tx.productVariant.updateMany({
          where: { id: { in: toDisable } },
          data: { isActive: false, stock: 0 },
        });
      }
      if (toDelete.length) {
        await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
      }
    });
  }

  private async uploadImages(productId: bigint, files: Express.Multer.File[]) {
    const existingCount = await this.prisma.productImage.count({ where: { productId } });

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.cloudinary.uploadBuffer(files[i].buffer);
        await this.prisma.productImage.create({
          data: {
            productId,
            cloudinaryId: result.publicId,
            url: result.url,
            urlThumbnail: result.urlThumbnail,
            urlMedium: result.urlMedium,
            isPrimary: existingCount === 0 && i === 0,
            sortOrder: existingCount + i,
          },
        });
      } catch (err) {
        this.logger.error(`Failed to upload image: ${err.message}`);
      }
    }
  }

  private async generateUniqueSlug(name: string, excludeId?: bigint): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) break;
      slug = `${base}-${counter++}`;
    }

    return slug;
  }
}
