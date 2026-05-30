import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    rawBody: true,
    bufferLogs: true 
  });

  // Use Pino Logger as global logger
  app.useLogger(app.get(Logger));

  // Swagger Documentation Setup
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProduction = nodeEnv === 'production';

  // Only enable Swagger in non-production environments to prevent API structure exposure
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('J-Ledger Portal API')
      .setDescription('The core API for J-Ledger Fintech Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  if (nodeEnv === 'production' && !process.env.JLEDGER_ALLOWED_ORIGINS) {
    throw new Error(
      'PRODUCTION SECURITY ERROR: JLEDGER_ALLOWED_ORIGINS environment variable must be explicitly defined in production.',
    );
  }

  const allowedOrigins = process.env.JLEDGER_ALLOWED_ORIGINS
    ? process.env.JLEDGER_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 3600,
    preflightContinue: false,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Portal Service running on port ${port} (0.0.0.0)`);
}
bootstrap();
