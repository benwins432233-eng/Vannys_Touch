import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { orders_status } from '@prisma/client';

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  notes?: string;

  // Delivery info
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deliveryFullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  deliveryPhone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deliveryCity: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deliveryDistrict: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  deliveryLandmark?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(orders_status)
  status: orders_status;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingNumber?: string;
}

export class OrderFilterDto {
  @IsEnum(orders_status)
  @IsOptional()
  status?: orders_status;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number = 20;
}
