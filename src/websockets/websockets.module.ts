import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [MessagesGateway],
  exports: [MessagesGateway],
})
export class WebsocketsModule {}
