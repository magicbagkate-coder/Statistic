import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/AppModule';

async function startAgent(): Promise<void> {
  await NestFactory.createApplicationContext(AppModule);
}

void startAgent();
