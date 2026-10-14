import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { StatsAgentService } from '@/agent/StatsAgentService';
import { AppModule } from '@/AppModule';

async function startAgent(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.get(StatsAgentService).runCollection();
  await app.close();
}

void startAgent();
