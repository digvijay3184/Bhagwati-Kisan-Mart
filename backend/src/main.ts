import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // 1. API versioning per PRD Section 2.4
  app.setGlobalPrefix('api/v1');

  // 2. Global validation pipe per PRD Section 2.5.2
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. Global response envelope & logging interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // 4. Global exception filter for secure error envelope
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. CORS for web storefront
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = configService.get<number>('port') || 4000;
  await app.listen(port);
  console.log(`Bhagwati Kisan Mart Backend running on http://localhost:${port}/api/v1`);
}

bootstrap();
