import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RequireModuleGuard } from './guards/require-module.guard';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { APP_GUARD } from '@nestjs/core';

const providers: any[] = [
  AuthService,
  JwtStrategy,
  JwtAuthGuard,
  ApiKeyGuard,
  RolesGuard,
  RequireModuleGuard,
  {
    provide: APP_GUARD,
    useExisting: JwtAuthGuard,
  },
];

// Only add GoogleStrategy if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleStrategy);
}

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    ApiKeysModule, // Phase 5: API key management
  ],
  controllers: [AuthController],
  providers,
  exports: [AuthService, ApiKeyGuard, RolesGuard, RequireModuleGuard],
})
export class AuthModule {}
