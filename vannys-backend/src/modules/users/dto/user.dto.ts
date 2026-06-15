import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { users_role } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(users_role)
  role: users_role;
}
