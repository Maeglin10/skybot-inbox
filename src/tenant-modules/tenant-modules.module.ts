import { Module } from '@nestjs/common';
import { TenantModulesController } from './tenant-modules.controller';
import { TenantModulesService } from './tenant-modules.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TenantModulesController],
  providers: [TenantModulesService],
  exports: [TenantModulesService],
})
export class TenantModulesModule {}
