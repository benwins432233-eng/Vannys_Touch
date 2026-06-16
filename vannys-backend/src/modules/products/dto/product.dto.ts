import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
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

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean = true;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  // Accepte "Rouge, Bleu, Vert" (FormData) ou ['Rouge','Bleu','Vert'] (JSON)
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

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

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

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
