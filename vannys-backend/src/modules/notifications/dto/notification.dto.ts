import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribePushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  auth: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  userAgent?: string;
}

export class UnsubscribePushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  endpoint: string;
}
