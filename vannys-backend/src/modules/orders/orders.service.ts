import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto/order.dto';
import { orders_status, users_role } from '@prisma/client';
import { findVariant, shippingFeeFor } from './order-rules';

// Convertir un string/number/bigint en BigInt pour les requêtes Prisma
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

@Injectable()
export class OrdersService {
  private readonly freeShippingThreshold: number;
  private readonly shippingFee: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.freeShippingThreshold = config.get<number>('FREE_SHIPPING_THRESHOLD', 50000);
    this.shippingFee = config.get<number>('SHIPPING_FEE', 2500);
  }

  async findMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const userIdBigInt = toId(userId);

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: userIdBigInt },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where: { userId: userIdBigInt } }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string, userRole: users_role) {
    const order = await this.prisma.order.findUnique({
      where: { id: toId(id) },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // users_role.admin est la valeur de l'enum MySQL (minuscule)
    if (userRole !== users_role.admin && order.userId !== toId(userId)) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('Order must have at least one item');

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of dto.items) {
      // Inclure les images et les variantes vendables dans la requête produit
      const product = await this.prisma.product.findFirst({
        where: { id: toId(item.productId), isActive: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true } },
        },
      });

      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      // Le stock vit sur la variante depuis le lot L1 : c'est la combinaison
      // commandée, et elle seule, qui décide si la ligne est vendable.
      const variant = findVariant(product.variants, item.color, item.size);
      if (!variant) {
        throw new BadRequestException(
          `La déclinaison choisie pour « ${product.name} » n'est plus proposée.`,
        );
      }
      if (variant.stock < item.quantity) {
        throw new ConflictException(
          variant.stock === 0
            ? `« ${product.name} » est épuisé.`
            : `Il ne reste que ${variant.stock} article(s) de « ${product.name} ».`,
        );
      }

      const lineTotal = Number(product.price) * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImageUrl: product.images[0]?.url || null,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: lineTotal,
        variantColor: item.color || null,
        variantSize: item.size || null,
      });
    }

    const shipping = shippingFeeFor(subtotal, this.freeShippingThreshold, this.shippingFee);
    const reference = await this.generateReference();

    const order = await this.prisma.order.create({
      data: {
        userId: toId(userId),
        reference,
        notes: dto.notes || null,
        subtotal,
        shippingFee: shipping,
        total: subtotal + shipping,
        // Champs obligatoires du schéma MySQL existant
        payment_method: 'MTN',
        phone_number: dto.deliveryPhone,
        deliveryFullName: dto.deliveryFullName,
        deliveryPhone: dto.deliveryPhone,
        deliveryCity: dto.deliveryCity,
        deliveryDistrict: dto.deliveryDistrict,
        deliveryAddress: dto.deliveryAddress,
        deliveryLandmark: dto.deliveryLandmark || null,
        items: { create: orderItems },
      },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    const orderWithUser = { ...order, user: order.user as any };
    this.mail.sendOrderConfirmed(orderWithUser as any).catch(() => null);
    this.mail.sendAdminNewOrder(orderWithUser as any).catch(() => null);

    return order;
  }

  async findAll(filters: OrderFilterDto) {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      // MySQL ne supporte pas mode:'insensitive' (c'est PostgreSQL)
      // MySQL est insensible à la casse par défaut sur les colonnes VARCHAR
      where.OR = [
        { reference: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const orderId = toId(id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const prevStatus = order.status;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
      },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    // Envoyer l'email d'expédition une seule fois (le schéma n'a pas "shipped" — on utilise "processing")
    if (dto.status === orders_status.processing && prevStatus !== orders_status.processing) {
      this.mail.sendOrderShipped(updated as any).catch(() => null);
    }

    return updated;
  }

  async getStats() {
    const [total, byStatus, revenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.order.aggregate({
        where: { status: { notIn: [orders_status.cancelled] } },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
      totalRevenue: revenue._sum.total || 0,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────

  private async generateReference(): Promise<string> {
    const count = await this.prisma.order.count();
    return `VT-${String(count + 1).padStart(5, '0')}`;
  }
}
