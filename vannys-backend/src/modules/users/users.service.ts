import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/user.dto';

// Convertir un string/number/bigint en BigInt pour les requêtes Prisma
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  // Accepte string | bigint pour éviter la double conversion dans updateRole et toggleActive
  async findOne(id: string | bigint) {
    const numericId = toId(id);
    const user = await this.prisma.user.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, reference: true, status: true, total: true, createdAt: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id: toId(id) },
      data: dto,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, avatarUrl: true, isActive: true, createdAt: true,
      },
    });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const numericId = toId(id);
    await this.findOne(numericId); // passe bigint — OK car findOne accepte string | bigint
    return this.prisma.user.update({
      where: { id: numericId },
      data: { role: dto.role },
      select: { id: true, email: true, role: true },
    });
  }

  async toggleActive(id: string) {
    const numericId = toId(id);
    const user = await this.findOne(numericId); // passe bigint — OK car findOne accepte string | bigint
    return this.prisma.user.update({
      where: { id: numericId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });
  }
}
