import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

// Global : le panier et les commandes lisent les frais de livraison, et
// d'autres modules suivront. Les déclarer un par un n'apporterait rien.
@Global()
@Module({
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
