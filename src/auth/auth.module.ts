import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from './api-key.guard';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles.guard';
import { CombinedAuthGuard } from './combined-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-jwt-secret-change-me',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, ApiKeyGuard, RolesGuard, CombinedAuthGuard],
  exports: [AuthService, JwtAuthGuard, ApiKeyGuard, RolesGuard, CombinedAuthGuard, JwtModule],
})
export class AuthModule {}
