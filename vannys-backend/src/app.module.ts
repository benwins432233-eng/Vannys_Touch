import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      // Validate required env vars at startup — fail fast
      validate: (config: Record<string, string>) => {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'JWT_REFRESH_SECRET',
          'RESEND_API_KEY',
          'MAIL_ADMIN_ADDRESS',
          'CLOUDINARY_CLOUD_NAME',
          'CLOUDINARY_API_KEY',
          'CLOUDINARY_API_SECRET',
        ];
        const missing = required.filter((k) => !config[k]);
        if (missing.length) {
          throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            `Check your .env file or deployment environment settings.`,
          );
        }
        return config;
      },
    }),
    PrismaModule,
    CloudinaryModule,
    MailModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    AddressesModule,
    HealthModule,
  ],
  providers: [
    // Apply JwtAuthGuard globally — use @Public() decorator to opt-out
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
