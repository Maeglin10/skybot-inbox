import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChannelsController, WebhooksController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { MetaConnector } from './connectors/meta.connector';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [ChannelsController, WebhooksController],
  providers: [ChannelsService, MetaConnector],
  exports: [ChannelsService],
})
export class ChannelsModule {}
