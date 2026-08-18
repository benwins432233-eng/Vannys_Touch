import {
  ArrayMaxSize,
  IsArray,
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

export class AddCartItemDto {
  // Les IDs MySQL sont des BigInt sérialisés en string numérique
  @IsNumberString()
  @IsNotEmpty()
  variantId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class UpdateCartItemDto {
  /** 0 supprime la ligne — c'est le geste attendu quand on décrémente à zéro. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}

/**
 * Ligne du panier local d'un visiteur qui se connecte.
 *
 * `variantId` est la forme courante. Les paniers enregistrés avant le lot L1 ne
 * connaissent que le produit et la déclinaison choisie : le serveur les résout
 * lui-même, plutôt que de jeter le panier d'une cliente qui vient de se
 * connecter.
 */
export class MergeCartItemDto {
  @IsNumberString()
  @IsOptional()
  variantId?: string;

  @IsNumberString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class MergeCartDto {
  @IsArray()
  // Un panier local plus long que cela ne vient pas d'une cliente.
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items: MergeCartItemDto[];
}
