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
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── User routes ─────────────────────────────────────────────

  @Get('my')
  @ApiOperation({ summary: 'Get current user orders' })
  myOrders(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ordersService.findMyOrders(user.id, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (owner or admin)' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id, user.role);
  }

  // ─── Admin routes ─────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] List all orders with filters' })
  adminFindAll(@Query() filters: OrderFilterDto) {
    return this.ordersService.findAll(filters);
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Get order statistics' })
  stats() {
    return this.ordersService.getStats();
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
