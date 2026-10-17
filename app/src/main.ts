import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    cors: true
  });
  const uploadDir = join(process.cwd(), 'resources');
   if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
  }
  app.use('/img', express.static(join(process.cwd(), 'resources')));
  app.enableCors({
    origin: [
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
