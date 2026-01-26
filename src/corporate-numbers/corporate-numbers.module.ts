import { Module } from '@nestjs/common';
import { CorporateNumbersController } from './corporate-numbers.controller';
import { CorporateNumbersService } from './corporate-numbers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CorporateNumbersController],
  providers: [CorporateNumbersService],
  exports: [CorporateNumbersService],
})
export class CorporateNumbersModule {}
