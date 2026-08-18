import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { SubscribePushDto, UnsubscribePushDto } from './dto/notification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Fil de notifications et compteur de non-lues' })
  list(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.notificationsService.list(user.id.toString(), page);
  }

  // Déclarée avant `:id/read` : « push » n'est pas un identifiant.
  @Public()
  @Get('push/config')
  @ApiOperation({ summary: 'Clé publique VAPID, ou push désactivé' })
  pushConfig() {
    return this.pushService.getConfig();
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id.toString());
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id.toString(), id);
  }

  @Post('push')
  @ApiOperation({ summary: 'Abonner cet appareil aux notifications push' })
  subscribe(@CurrentUser() user: User, @Body() dto: SubscribePushDto) {
    return this.notificationsService.subscribePush(user.id.toString(), dto);
  }

  @Delete('push')
  @ApiOperation({ summary: 'Désabonner cet appareil' })
  unsubscribe(@CurrentUser() user: User, @Body() dto: UnsubscribePushDto) {
    return this.notificationsService.unsubscribePush(user.id.toString(), dto);
  }
}
