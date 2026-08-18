import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';
import type { NotificationContent } from './notification-types';

/**
 * Notifications push web.
 *
 * **Facultatif par construction** : sans clés VAPID, le service se désactive et
 * l'application fonctionne exactement pareil, notifications in-app comprises.
 * Faire échouer le démarrage pour une fonctionnalité de confort priverait la
 * boutique de tout le reste.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private publicKey: string | null = null;
  private enabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');

    if (!publicKey || !privateKey || !subject) {
      this.logger.log('Push web désactivé : VAPID_* absent de la configuration.');
      return;
    }

    // `mailto:` ou une URL https — web-push refuse tout le reste au premier envoi,
    // autant s'en apercevoir au démarrage.
    if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) {
      this.logger.error(
        `Push web désactivé : VAPID_SUBJECT doit commencer par « mailto: » ou « https:// » (reçu « ${subject} »).`,
      );
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.publicKey = publicKey;
      this.enabled = true;
      this.logger.log('Push web activé.');
    } catch (error) {
      this.logger.error(`Push web désactivé : clés VAPID invalides (${(error as Error).message}).`);
    }
  }

  /** Le client interroge cette configuration avant de proposer l'abonnement. */
  getConfig() {
    return { enabled: this.enabled, publicKey: this.publicKey };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Envoie une notification à tous les appareils d'un compte.
   * Un abonnement refusé par le navigateur (404/410) est supprimé : le garder
   * ferait échouer tous les envois suivants.
   */
  async sendToUser(userId: bigint, content: NotificationContent): Promise<void> {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (!subscriptions.length) return;

    const payload = JSON.stringify({
      title: content.title,
      body: content.message,
      link: content.link,
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription
              .delete({ where: { id: subscription.id } })
              .catch(() => null);
            return;
          }
          // Une panne d'envoi ne doit pas remonter : la notification in-app,
          // elle, est déjà enregistrée.
          this.logger.warn(`Échec d'envoi push (${statusCode ?? 'inconnu'})`);
        }
      }),
    );
  }
}
