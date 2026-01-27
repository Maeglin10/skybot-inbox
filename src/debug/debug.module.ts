import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DebugController } from './debug.controller';
import { ApiKeysModule } from '../auth/api-keys/api-keys.module';

@Module({
  imports: [PrismaModule, ApiKeysModule],
  controllers: [DebugController],
})
export class DebugModule {}
