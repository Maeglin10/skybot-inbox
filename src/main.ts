import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: false,
    allowedHeaders: ['Content-Type', 'x-api-key'],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  });

  // JSON global + capture rawBody uniquement pour le webhook
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl?.startsWith('/webhooks/whatsapp')) {
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

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
