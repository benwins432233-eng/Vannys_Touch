import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto/order.dto';
import { OrderStatus, Role } from '@prisma/client';

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
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('Order must have at least one item');

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
      });

      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (!product.inStock) throw new BadRequestException(`Product "${product.name}" is out of stock`);

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

    const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingFee;
    const reference = await this.generateReference();

    const order = await this.prisma.order.create({
      data: {
        userId,
        reference,
        notes: dto.notes || null,
        subtotal,
        shippingFee: shipping,
        total: subtotal + shipping,
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

    // Non-blocking email notifications
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
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const prevStatus = order.status;

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
      },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    // Send "shipped" email only once
    if (dto.status === OrderStatus.SHIPPED && prevStatus !== OrderStatus.SHIPPED) {
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
        where: { status: { notIn: [OrderStatus.CANCELLED] } },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
      totalRevenue: revenue._sum.total || 0,
    };
  }

  // ─── Private helpers ─────────────────────────────────────────

  private async generateReference(): Promise<string> {
    const count = await this.prisma.order.count();
    return `VT-${String(count + 1).padStart(5, '0')}`;
  }
}
