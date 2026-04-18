import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  assertRequiredEnv([
    'DATABASE_URL',
    'API_GATEWAY_URL',
    'JLEDGER_INTERNAL_SECRET',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_REGISTRATION_SECRET',
    'KYC_ENCRYPTION_KEY',
  ]);

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();

function assertRequiredEnv(keys: string[]) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}
