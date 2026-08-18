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
import slugify from 'slugify';

//Convertir les types string en bigInt
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
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
    const {
      category, search, minPrice, maxPrice, featured,
      sort = 'createdAt', dir = 'desc',
      page = 1, limit = 12,
    } = filters;

    const skip = (page - 1) * Math.min(limit, 50);
    const take = Math.min(limit, 50);

    const where: any = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }
    if (search) {
      // MySQL ne supporte pas mode:'insensitive' (c'est PostgreSQL) : Prisma rejette
      // l'argument et la recherche échouait. MySQL est déjà insensible à la casse
      // sur les collations utf8mb4_*_ci des colonnes VARCHAR/TEXT.
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };
    if (featured) where.isFeatured = true;

    const allowedSorts = ['price', 'rating', 'createdAt'];
    const orderBy = { [allowedSorts.includes(sort) ? sort : 'createdAt']: dir === 'asc' ? 'asc' : 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
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
      meta: { total, page, limit: take, lastPage: Math.ceil(total / take) },
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
