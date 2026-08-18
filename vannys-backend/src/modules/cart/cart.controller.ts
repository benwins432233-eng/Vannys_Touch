import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CartService } from './cart.service';
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Panier du client, totaux calculés par le serveur' })
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id.toString());
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une variante au panier (regroupe les doublons)' })
  addItem(@CurrentUser() user: User, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id.toString(), dto);
  }

  // Déclarée avant `PATCH :itemId` n'est pas nécessaire (verbes différents),
  // mais `merge` doit rester une route fixe, jamais un identifiant.
  @Post('merge')
  @ApiOperation({ summary: 'Fusionner le panier local d’un visiteur qui se connecte' })
  merge(@CurrentUser() user: User, @Body() dto: MergeCartDto) {
    return this.cartService.merge(user.id.toString(), dto.items);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Changer la quantité d’une ligne (0 la supprime)' })
  updateItem(
    @CurrentUser() user: User,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id.toString(), itemId, dto.quantity);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Retirer une ligne du panier' })
  removeItem(@CurrentUser() user: User, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(user.id.toString(), itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vider le panier' })
  clear(@CurrentUser() user: User) {
    return this.cartService.clear(user.id.toString());
  }
}
