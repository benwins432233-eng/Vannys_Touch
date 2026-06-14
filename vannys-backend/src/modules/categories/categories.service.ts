import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import slugify from 'slugify';

//Convertir les types string en bigInt
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};


@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async findAllAdmin() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });

    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) throw new ConflictException('Category with this name already exists');

    return this.prisma.category.create({
      data: { ...dto, slug },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const categoryId = toId(id);
    await this.findById(id);

    const data: any = { ...dto };
    if (dto.name) {
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }

    return this.prisma.category.update({ where: { id: categoryId }, data });
  }

  async remove(id: string) {
    const categoryId = toId(id);
    await this.findById(id);
    const count = await this.prisma.product.count({ where: { categoryId: categoryId } });
    if (count > 0) {
      throw new ConflictException(`Cannot delete category with ${count} products`);
    }
    await this.prisma.category.delete({ where: { id: categoryId } });
    return { message: 'Category deleted' };
  }

  private async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
