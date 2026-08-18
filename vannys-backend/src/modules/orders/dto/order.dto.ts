import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { orders_payment_method, orders_status } from '@prisma/client';

export class OrderItemDto {
  // Les IDs MySQL sont des BigInt sérialisés en string numérique (ex: "123456")
  // @IsUUID() est incorrect ici — on valide un string numérique à la place
  @IsNumberString()
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

  /**
   * Mode de règlement. Le paiement à la livraison est le mode par défaut ; les
   * modes mobile money restent acceptés. Le tunnel n'en dépend pas.
   */
  @IsEnum(orders_payment_method)
  @IsOptional()
  paymentMethod?: orders_payment_method;

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

  /**
   * @deprecated Le contenu de la commande vient du panier serveur depuis le lot
   * L3. Ce champ n'est utilisé que si le panier est vide, pour les clients déjà
   * déployés, et ne peut jamais fixer un prix.
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(orders_status)
  status: orders_status;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingNumber?: string;

  /** Motif ou précision, conservé dans l'historique. */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
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
