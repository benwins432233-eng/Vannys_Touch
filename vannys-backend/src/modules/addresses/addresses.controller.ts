import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Carnet d’adresses du client, adresse par défaut en tête' })
  findAll(@CurrentUser() user: User) {
    return this.addressesService.findAll(user.id.toString());
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une adresse' })
  create(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id.toString(), dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Définir l’adresse par défaut' })
  setDefault(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.setDefault(user.id.toString(), id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une adresse' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id.toString(), id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une adresse' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.remove(user.id.toString(), id);
  }
}
