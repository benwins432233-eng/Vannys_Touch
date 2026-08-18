import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';
import { SubscribePushDto, UnsubscribePushDto } from './dto/notification.dto';
import type { NotificationContent } from './notification-types';

const toId = (id: string | number | bigint): bigint => {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID format: ${id}`);
  }
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  // ── Lecture ───────────────────────────────────────────────────

  async list(userId: string, page = 1, limit = 20) {
    const owner = toId(userId);
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: owner },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId: owner } }),
      this.prisma.notification.count({ where: { userId: owner, readAt: null } }),
    ]);

    return {
      items,
      unreadCount,
      meta: { total, page, limit: take, lastPage: Math.max(1, Math.ceil(total / take)) },
    };
  }

  // ── Écriture ──────────────────────────────────────────────────

  async markRead(userId: string, id: string) {
    const owner = toId(userId);
    const notification = await this.prisma.notification.findUnique({ where: { id: toId(id) } });

    // La notification d'un autre compte répond « introuvable », pas « interdit ».
    if (!notification || notification.userId !== owner) {
      throw new NotFoundException('Notification introuvable.');
    }

    if (!notification.readAt) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { readAt: new Date() },
      });
    }

    return this.list(userId);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId: toId(userId), readAt: null },
      data: { readAt: new Date() },
    });
    return this.list(userId);
  }

  async subscribePush(userId: string, dto: SubscribePushDto) {
    const owner = toId(userId);

    // Un même appareil peut être réabonné après réinstallation, ou changer de
    // compte : l'endpoint est unique, on le réattribue plutôt que d'échouer.
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId: owner,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent || null,
      },
      update: {
        userId: owner,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent || null,
      },
    });

    return { message: 'Notifications activées sur cet appareil.' };
  }

  async unsubscribePush(userId: string, dto: UnsubscribePushDto) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId: toId(userId), endpoint: dto.endpoint },
    });
    return { message: 'Notifications désactivées sur cet appareil.' };
  }

  // ── Déclencheurs ──────────────────────────────────────────────

  /**
   * Enregistre une notification et tente un push.
   *
   * Ne lève jamais : une notification est un service rendu en plus, pas une
   * étape du parcours. Échouer ici ferait échouer la commande qui l'a déclenchée.
   */
  async notify(userId: bigint, content: NotificationContent): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type: content.type,
          title: content.title,
          message: content.message,
          link: content.link,
        },
      });
      await this.push.sendToUser(userId, content);
    } catch (error) {
      this.logger.error(`Notification non enregistrée : ${(error as Error).message}`);
    }
  }

  /** Prévient toute l'administration — nouvelle commande, stock faible. */
  async notifyAdmins(content: NotificationContent): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin', isActive: true },
        select: { id: true },
      });
      await Promise.all(admins.map((admin) => this.notify(admin.id, content)));
    } catch (error) {
      this.logger.error(`Notification admin non envoyée : ${(error as Error).message}`);
    }
  }
}
