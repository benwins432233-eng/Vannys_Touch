import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 4000);
  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:5173');
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // ── Global prefix ─────────────────────────────────────────
  app.setGlobalPrefix(prefix);

  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'production' ? frontendUrl : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Validation pipe ───────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filter & interceptors ──────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ── Swagger (dev only) ────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Vannys Touch API')
      .setDescription('API e-commerce Vannys Touch — NestJS + Prisma + PostgreSQL')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📚 Swagger: http://localhost:${port}/docs`);
  }

  // ── Graceful shutdown ─────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Server running → http://localhost:${port}/${prefix} [${nodeEnv}]`);
}

bootstrap();
