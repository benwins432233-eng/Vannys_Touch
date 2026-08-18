import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Helper : accepte un tableau déjà formé OU une string CSV "Rouge, Bleu" → ['Rouge', 'Bleu']
// Nécessaire car FormData envoie tout en string, même les tableaux
const toStringArray = ({ value }: { value: any }): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v: string) => v.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
};

const toBoolean = ({ value }: { value: any }): boolean => {
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
};

/**
 * FormData ne transporte que du texte : les variantes arrivent sous forme de
 * JSON sérialisé. En JSON pur, le tableau arrive déjà construit.
 */
const toVariantArray = ({ value }: { value: any }): unknown => {
  if (typeof value !== 'string') return value;
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    // Laisse la validation rejeter proprement plutôt que de lever ici.
    return value;
  }
};

/** Une combinaison vendable : c'est elle qui porte le stock. */
export class ProductVariantDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  sku?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  originalPrice?: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  badge?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  lowStockThreshold?: number;

  /**
   * @deprecated La disponibilité se déduit du stock des variantes depuis le
   * lot L1. Le champ est encore accepté pour ne pas casser les clients déjà
   * déployés : il ne sert qu'à initialiser le stock d'un produit créé sans
   * variante. Il sera retiré à la prochaine version majeure.
   */
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @Transform(toVariantArray)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  /** @deprecated Utiliser `variants`. Combiné avec `sizes` en produit cartésien. */
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  /** @deprecated Utiliser `variants`. */
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  originalPrice?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  badge?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  lowStockThreshold?: number;

  /** @deprecated Voir CreateProductDto.inStock. Ignoré si le produit a des variantes. */
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(toVariantArray)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  /** @deprecated Utiliser `variants`. */
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  /** @deprecated Utiliser `variants`. */
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];
}

export class ProductFilterDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsString()
  @IsOptional()
  sort?: 'price' | 'rating' | 'createdAt' = 'createdAt';

  @IsString()
  @IsOptional()
  dir?: 'asc' | 'desc' = 'desc';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 12;
}
