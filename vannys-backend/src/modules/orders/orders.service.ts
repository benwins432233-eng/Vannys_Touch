import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  adminNewOrder,
  lowStock,
  orderCreated,
  orderStatusChanged,
} from '../notifications/notification-types';
import {
  CancelOrderDto,
  CreateOrderDto,
  OrderItemDto,
  UpdateOrderStatusDto,
  OrderFilterDto,
} from './dto/order.dto';
import { Prisma, orders_status, users_role } from '@prisma/client';
import { findVariant, shippingFeeFor } from './order-rules';
import {
  allowedTransitionsFrom,
  buildOrderReference,
  canClientCancel,
  canTransition,
  ORDER_STATUS_LABELS,
  restoresStock,
} from './order-status';

// Convertir un string/number/bigint en BigInt pour les requêtes Prisma
const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

/** Ligne prête à être écrite : produit vérifié, prix relu en base. */
interface ResolvedLine {
  variantId: bigint;
  productId: bigint;
  productName: string;
  productImageUrl: string | null;
  unitPrice: Prisma.Decimal;
  quantity: number;
  subtotal: number;
  variantColor: string | null;
  variantSize: string | null;
}

const USER_SUMMARY = {
  select: { id: true, firstName: true, lastName: true, email: true, phone: true },
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly freeShippingThreshold: number;
  private readonly shippingFee: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    config: ConfigService,
  ) {
    // TODO (lot L6) : ces montants viendront de la table `settings`.
    this.freeShippingThreshold = config.get<number>('FREE_SHIPPING_THRESHOLD', 50000);
    this.shippingFee = config.get<number>('SHIPPING_FEE', 2500);
  }

  // ── Lecture ───────────────────────────────────────────────────

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
        user: USER_SUMMARY,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // users_role.admin est la valeur de l'enum MySQL (minuscule)
    if (userRole !== users_role.admin && order.userId !== toId(userId)) {
      throw new ForbiddenException('Access denied');
    }

    // L'interface ne doit jamais proposer un geste que le serveur refusera.
    return { ...order, canCancel: canClientCancel(order.status) };
  }

  /** Vue administration : détail, historique et transitions réellement permises. */
  async findOneForAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: toId(id) },
      include: {
        items: true,
        user: USER_SUMMARY,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      allowedTransitions: allowedTransitionsFrom(order.status).map((status) => ({
        status,
        label: ORDER_STATUS_LABELS[status],
      })),
    };
  }

  async findAll(filters: OrderFilterDto) {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
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

  // ── Création ──────────────────────────────────────────────────

  /**
   * Enregistre une commande dans une transaction unique.
   *
   * Tout se joue ici : verrouiller les variantes, vérifier le stock, recalculer
   * les montants depuis la base, écrire la commande, décrémenter et vider le
   * panier. Hors transaction, deux clientes achetant le dernier article en même
   * temps repartaient toutes les deux avec une commande valide.
   */
  async create(userId: string, dto: CreateOrderDto) {
    const userIdBigInt = toId(userId);

    // Une commande part avec des emails de suivi : sans adresse vérifiée, la
    // cliente ne recevrait rien et personne ne s'en apercevrait (lot L4).
    const user = await this.prisma.user.findUnique({ where: { id: userIdBigInt } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.email_verified_at) {
      throw new ForbiddenException(
        'Confirmez votre adresse email avant de commander. Un lien vous a été envoyé.',
      );
    }

    const requested = await this.resolveRequestedItems(userIdBigInt, dto.items);
    if (!requested.length) throw new BadRequestException('Votre panier est vide.');

    const reference = await this.generateReference();

    const order = await this.prisma.$transaction(
      async (tx) => {
        // 1. Verrouiller les variantes concernées pour la durée de la transaction.
        const variantIds = requested.map((i) => i.variantId);
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM product_variants WHERE id IN (${Prisma.join(variantIds)}) FOR UPDATE`,
        );

        // 2. Relire produit, variante et stock une fois le verrou tenu.
        const lines = await this.buildLines(tx, requested);

        // 3. Recalculer les montants : rien de ce que le client envoie ne compte.
        const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
        const shipping = shippingFeeFor(subtotal, this.freeShippingThreshold, this.shippingFee);

        // 4. Écrire la commande, ses lignes et son état initial.
        const created = await tx.order.create({
          data: {
            userId: userIdBigInt,
            reference,
            status: 'pending',
            notes: dto.notes || null,
            subtotal,
            shippingFee: shipping,
            total: subtotal + shipping,
            payment_method: dto.paymentMethod ?? 'CASH_ON_DELIVERY',
            phone_number: dto.deliveryPhone,
            deliveryFullName: dto.deliveryFullName,
            deliveryPhone: dto.deliveryPhone,
            deliveryCity: dto.deliveryCity,
            deliveryDistrict: dto.deliveryDistrict,
            deliveryAddress: dto.deliveryAddress,
            deliveryLandmark: dto.deliveryLandmark || null,
            items: { create: lines },
            statusHistory: {
              create: { status: 'pending', comment: 'Commande enregistrée' },
            },
          },
          include: { items: true, user: USER_SUMMARY },
        });

        // 5. Décrémenter le stock. La condition `gte` est une seconde barrière :
        //    si elle ne touche aucune ligne, c'est que le verrou a été contourné.
        for (const line of lines) {
          const updated = await tx.productVariant.updateMany({
            where: { id: line.variantId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count !== 1) {
            throw new ConflictException(`« ${line.productName} » n'est plus disponible.`);
          }
        }

        // 6. La commande consomme le panier.
        await tx.cartItem.deleteMany({ where: { cart: { userId: userIdBigInt } } });

        return created;
      },
      { timeout: 15000 },
    );

    const orderWithUser = { ...order, user: order.user as any };
    this.mail.sendOrderConfirmed(orderWithUser as any).catch(() => null);
    this.mail.sendAdminNewOrder(orderWithUser as any).catch(() => null);

    // Notifications hors transaction : une panne d'envoi ne doit pas annuler
    // une commande déjà enregistrée et déjà décrémentée du stock.
    const orderId = order.id.toString();
    void this.notifications.notify(userIdBigInt, orderCreated(order.reference, orderId));
    void this.notifications.notifyAdmins(
      adminNewOrder(
        order.reference,
        orderId,
        `${user.firstName} ${user.lastName}`,
        `${Number(order.total).toLocaleString('fr-FR')} FCFA`,
      ),
    );
    void this.warnLowStock(order.items.map((item) => item.variantId));

    return order;
  }

  // ── Changements d'état ────────────────────────────────────────

  /**
   * Annulation par la cliente. Autorisée tant que la commande n'est pas partie
   * en préparation ; au-delà, l'administration seule sait ce qui a déjà bougé.
   */
  async cancelByClient(id: string, userId: string, dto: CancelOrderDto) {
    const orderId = toId(id);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== toId(userId)) throw new ForbiddenException('Access denied');

    if (!canClientCancel(order.status)) {
      throw new BadRequestException(
        `Une commande « ${ORDER_STATUS_LABELS[order.status]} » ne peut plus être annulée. ` +
          'Contactez-nous pour toute demande.',
      );
    }

    return this.applyStatus(orderId, 'cancelled', {
      comment: dto.comment || 'Annulée par la cliente',
      changedByUserId: toId(userId),
    });
  }

  /** Changement d'état par l'administration. */
  async updateStatus(id: string, dto: UpdateOrderStatusDto, adminUserId?: string) {
    return this.applyStatus(toId(id), dto.status, {
      comment: dto.comment,
      trackingNumber: dto.trackingNumber,
      changedByUserId: adminUserId ? toId(adminUserId) : undefined,
    });
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

  /**
   * Applique une transition, écrit l'historique et rend le stock si besoin —
   * le tout dans une transaction, pour qu'un état changé sans trace ou un stock
   * rendu sans annulation soient impossibles.
   */
  private async applyStatus(
    orderId: bigint,
    next: orders_status,
    options: { comment?: string; trackingNumber?: string; changedByUserId?: bigint },
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      if (order.status === next) {
        throw new BadRequestException(
          `La commande est déjà « ${ORDER_STATUS_LABELS[next]} ».`,
        );
      }
      if (!canTransition(order.status, next)) {
        throw new BadRequestException(
          `Transition impossible : « ${ORDER_STATUS_LABELS[order.status]} » ` +
            `ne peut pas devenir « ${ORDER_STATUS_LABELS[next]} ».`,
        );
      }

      // Le stock ne revient qu'une fois : `stockRestoredAt` est le verrou.
      const shouldRestore = restoresStock(next) && order.stockRestoredAt === null;
      if (shouldRestore) {
        for (const item of order.items) {
          if (!item.variantId) {
            // Commande antérieure au lot L3, ou variante supprimée depuis :
            // rien à recréditer, mais il faut le savoir en cas d'écart d'inventaire.
            this.logger.warn(
              `Stock non restitué pour la ligne ${item.id} : variante inconnue`,
            );
            continue;
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: next,
          comment: options.comment || null,
          changedByUserId: options.changedByUserId ?? null,
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: next,
          ...(options.trackingNumber && { trackingNumber: options.trackingNumber }),
          ...(next === 'cancelled' && { cancelledAt: new Date() }),
          ...(shouldRestore && { stockRestoredAt: new Date() }),
        },
        include: {
          items: true,
          user: USER_SUMMARY,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    // L'email part hors transaction : un envoi lent ne doit pas tenir un verrou.
    if (next === 'shipping') {
      this.mail.sendOrderShipped(updated as any).catch(() => null);
    }

    void this.notifications.notify(
      updated.userId,
      orderStatusChanged(updated.reference, updated.id.toString(), next),
    );

    return updated;
  }

  /**
   * Prévient l'administration des déclinaisons passées sous le seuil d'alerte.
   * Appelé après une commande : c'est le seul moment où le stock baisse.
   */
  private async warnLowStock(variantIds: (bigint | null)[]): Promise<void> {
    try {
      const ids = variantIds.filter((id): id is bigint => id !== null);
      if (!ids.length) return;

      const variants = await this.prisma.productVariant.findMany({
        where: { id: { in: ids } },
        select: { productId: true },
        distinct: ['productId'],
      });

      for (const { productId } of variants) {
        // Le seuil vaut pour le produit entier, pas pour une seule
        // déclinaison : trois tailles à une unité chacune, ce n'est pas
        // une rupture.
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          select: {
            name: true,
            lowStockThreshold: true,
            variants: { where: { isActive: true }, select: { stock: true } },
          },
        });
        if (!product) continue;

        const remaining = product.variants.reduce((sum, v) => sum + v.stock, 0);
        if (remaining <= product.lowStockThreshold) {
          await this.notifications.notifyAdmins(
            lowStock(product.name, remaining, productId.toString()),
          );
        }
      }
    } catch (error) {
      this.logger.warn(`Alerte de stock faible non envoyée : ${(error as Error).message}`);
    }
  }

  /**
   * Contenu de la commande.
   *
   * Le panier serveur fait foi depuis le lot L2. Les `items` envoyés dans la
   * requête restent acceptés pour les clients déjà déployés, mais uniquement si
   * le panier est vide : ils ne peuvent ni contredire le panier, ni fixer un prix.
   */
  private async resolveRequestedItems(
    userId: bigint,
    fallbackItems?: OrderItemDto[],
  ): Promise<{ variantId: bigint; quantity: number }[]> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { cart: { userId } },
      orderBy: { createdAt: 'asc' },
    });

    if (cartItems.length) {
      return cartItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
    }

    if (!fallbackItems?.length) return [];

    this.logger.warn(`Commande créée depuis un client hérité (panier serveur vide)`);
    const resolved: { variantId: bigint; quantity: number }[] = [];

    for (const item of fallbackItems) {
      const variants = await this.prisma.productVariant.findMany({
        where: { productId: toId(item.productId), isActive: true },
      });
      const variant = findVariant(variants, item.color, item.size);
      if (!variant) {
        throw new BadRequestException(
          "La déclinaison choisie n'est plus proposée. Actualisez votre panier.",
        );
      }
      resolved.push({ variantId: variant.id, quantity: item.quantity });
    }

    return resolved;
  }

  /** Vérifie chaque ligne et fige son instantané, verrou déjà tenu. */
  private async buildLines(
    tx: Prisma.TransactionClient,
    requested: { variantId: bigint; quantity: number }[],
  ): Promise<ResolvedLine[]> {
    const lines: ResolvedLine[] = [];

    for (const { variantId, quantity } of requested) {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        },
      });

      if (!variant || !variant.isActive || !variant.product.isActive) {
        throw new BadRequestException(
          `« ${variant?.product.name ?? 'Un article'} » n'est plus proposé à la vente.`,
        );
      }
      if (variant.stock < quantity) {
        throw new ConflictException(
          variant.stock === 0
            ? `« ${variant.product.name} » est épuisé.`
            : `Il ne reste que ${variant.stock} article(s) de « ${variant.product.name} ».`,
        );
      }

      const unitPrice = variant.product.price;
      lines.push({
        variantId: variant.id,
        productId: variant.productId,
        productName: variant.product.name,
        productImageUrl: variant.product.images[0]?.url || null,
        unitPrice,
        quantity,
        subtotal: Number(unitPrice) * quantity,
        variantColor: variant.color,
        variantSize: variant.size,
      });
    }

    return lines;
  }

  /**
   * Référence unique au format CMD-AAAAMMJJ-XXXXXX.
   * Le suffixe est tiré au sort : l'ancien `count() + 1` donnait la même
   * référence à deux commandes simultanées, et l'insertion échouait.
   */
  private async generateReference(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(4).readUInt32BE(0).toString(36).toUpperCase();
      const reference = buildOrderReference(new Date(), suffix);
      const existing = await this.prisma.order.findUnique({ where: { reference } });
      if (!existing) return reference;
    }
    // Cinq collisions d'affilée sur 36^6 possibilités : mieux vaut échouer
    // bruyamment que boucler indéfiniment.
    throw new ConflictException('Impossible de générer une référence de commande.');
  }
}
