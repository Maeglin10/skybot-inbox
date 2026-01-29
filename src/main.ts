import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import helmet from 'helmet';
import type { Request } from 'express';
import { winstonLogger } from './common/logger/winston.config';
import { initializeSentry } from './common/sentry/sentry.config';

async function bootstrap() {
  // Initialize Sentry as early as possible to catch all errors
  initializeSentry();

  const app = await NestFactory.create(AppModule);

  // Apply security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding if needed
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like health checks, curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://skybot-inbox-ui.onrender.com',
        'https://skybot-inbox.onrender.com',
      ];

      // In production, only allow specific origins
      if (process.env.NODE_ENV === 'production') {
        if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }

      // In development, allow localhost
      if (origin.includes('localhost')) return callback(null, true);

      // Allow Render domains
      if (origin.includes('onrender.com')) return callback(null, true);

      // Reject others
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // JSON global + capture rawBody uniquement pour le webhook
  app.use(
    express.json({
      verify: (req: RawBodyRequest, _res, buf: Buffer) => {
        const url = req.originalUrl ?? req.url;
        if (url.startsWith('/webhooks/whatsapp')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Add global /api prefix to all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  winstonLogger.info(`Application started successfully`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    url: `http://0.0.0.0:${port}`,
  });
  type RawBodyRequest = Request & { rawBody?: Buffer };
}
void bootstrap();
