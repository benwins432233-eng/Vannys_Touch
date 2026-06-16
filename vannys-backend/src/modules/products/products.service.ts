import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto/product.dto';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

//Convertir les types string en bigInt
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

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
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
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
          variants: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { total, page, limit: take, lastPage: Math.ceil(total / take) },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        reviews: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findById(id: string | bigint) {
    const product = await this.prisma.product.findUnique({
      where: { id: toId(id) },
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, imageFiles: Express.Multer.File[]) {
    const slug = await this.generateUniqueSlug(dto.name);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice || null,
        categoryId: toId(dto.categoryId),
        badge: dto.badge || null,
        inStock: dto.inStock ?? true,
        isFeatured: dto.isFeatured ?? false,
      },
    });

    // Upload images
    if (imageFiles?.length) {
      await this.uploadImages(product.id, imageFiles);
    }

    // Create variants
    if (dto.colors?.length) {
      await this.prisma.productVariant.createMany({
        data: dto.colors.filter(Boolean).map((v) => ({
          productId: product.id, type: 'color', value: v.trim(),
        })),
      });
    }
    if (dto.sizes?.length) {
      await this.prisma.productVariant.createMany({
        data: dto.sizes.filter(Boolean).map((v) => ({
          productId: product.id, type: 'size', value: v.trim(),
        })),
      });
    }

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
      'inStock', 
      'isFeatured', 
      'isActive'
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

    // Replace variants if provided
    if (dto.colors !== undefined || dto.sizes !== undefined) {
      await this.prisma.productVariant.deleteMany({ where: { productId: numericId } });

      const newVariants = [
        ...(dto.colors || []).filter(Boolean).map((v) => ({ productId: numericId, type: 'color' as const, value: v.trim() })),
        ...(dto.sizes || []).filter(Boolean).map((v) => ({ productId: numericId, type: 'size' as const, value: v.trim() })),
      ];
      if (newVariants.length) {
        await this.prisma.productVariant.createMany({ data: newVariants });
      }
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
