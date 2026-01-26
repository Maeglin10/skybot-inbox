import { Module } from '@nestjs/common';
import { AgentsGateway } from './agents.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AgentsGateway],
  exports: [AgentsGateway],
})
export class WebsocketsModule {}
