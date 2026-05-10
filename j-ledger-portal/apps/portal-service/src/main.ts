import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());

  // Enhanced Request Logger with Colors & Time
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      // Status Color Logic
      const sColor =
        status >= 500
          ? '\x1b[31m'
          : status >= 400
            ? '\x1b[33m'
            : status >= 300
              ? '\x1b[36m'
              : '\x1b[32m';
      const mColor = '\x1b[35m'; // Magenta for Method
      const reset = '\x1b[0m';

      console.log(
        `[${new Date().toLocaleTimeString()}] ${mColor}${req.method}${reset} ${req.url} ${sColor}${status}${reset} - ${duration}ms`,
      );
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Portal Service running on port ${port} (0.0.0.0)`);
}
bootstrap();
