import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import type { Request } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like health checks, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow localhost for development
      if (origin.includes('localhost')) return callback(null, true);

      // Allow Render internal health checks
      if (origin.includes('onrender.com')) return callback(null, true);

      // Reject others
      callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
    allowedHeaders: ['Content-Type', 'x-api-key'],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
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
  console.log(`🚀 Application is running on http://0.0.0.0:${port}`);
  type RawBodyRequest = Request & { rawBody?: Buffer };
}
void bootstrap();
