import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('debug')
@UseGuards(ApiKeyGuard)
export class DebugController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('counts')
  async counts() {
    const [contacts, conversations, messages] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
    ]);
    return { contacts, conversations, messages };
  }
}
