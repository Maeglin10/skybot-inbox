import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AgentsGateway } from './agents.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AgentsGateway],
  exports: [AgentsGateway],
})
export class WebsocketsModule {}
