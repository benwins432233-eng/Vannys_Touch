import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Réglages publics de la boutique (lecture seule)' })
  getPublic() {
    return this.settingsService.getAll();
  }

  @Get('admin/settings')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Réglages et catalogue des champs éditables' })
  async getForAdmin() {
    const [values, fields] = await Promise.all([
      this.settingsService.getAll(),
      this.settingsService.describe(),
    ]);
    return { values, fields };
  }

  @Put('admin/settings')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Modifier les réglages de la boutique' })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto.settings);
  }
}
