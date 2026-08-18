import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CancelOrderDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderFilterDto,
} from './dto/order.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── User routes ───────────────────────────────────────────

  @Get('my')
  @ApiOperation({ summary: 'Get current user orders' })
  myOrders(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // user.id est BigInt (Prisma/MySQL) — le service attend un string
    return this.ordersService.findMyOrders(user.id.toString(), page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id.toString(), dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler sa propre commande (états pending et confirmed)' })
  cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelByClient(id, user.id.toString(), dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (owner or admin)' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id.toString(), user.role);
  }

  // ── Admin routes ──────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] List all orders with filters' })
  adminFindAll(@Query() filters: OrderFilterDto) {
    return this.ordersService.findAll(filters);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Order statistics' })
  stats() {
    return this.ordersService.getStats();
  }

  // Déclarée APRÈS `admin/all` et `admin/stats` : sinon `:id` capterait ces
  // deux routes littérales, qui sont également en deux segments.
  @Get('admin/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Détail, historique et transitions autorisées' })
  adminFindOne(@Param('id') id: string) {
    return this.ordersService.findOneForAdmin(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Update order status' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id.toString());
  }
}
