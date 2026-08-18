import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushService } from './push.service';

@Module({
  providers: [NotificationsService, PushService],
  controllers: [NotificationsController],
  // Les commandes et les produits déclenchent des notifications.
  exports: [NotificationsService],
})
export class NotificationsModule {}
