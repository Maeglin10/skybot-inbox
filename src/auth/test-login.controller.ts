import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('auth/test')
export class TestLoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async testLogin(@Body() dto: LoginDto) {
    console.log('[TEST-LOGIN] Received request:', { username: dto.username, hasPassword: !!dto.password });

    try {
      const result = await this.authService.login(dto);
      console.log('[TEST-LOGIN] Success for:', dto.username);
      return { success: true, ...result };
    } catch (error) {
      console.log('[TEST-LOGIN] Failed:', error);
      throw error;
    }
  }

  @Public()
  @SkipThrottle()
  @Get('debug-user')
  async debugUser() {
    const username = 'goodlife.nexxaagents';
    const password = '4qFEZPjc8f';

    const user = await this.prisma.userAccount.findFirst({
      where: { username },
    });

    if (!user) {
      return { error: 'User not found', username };
    }

    const passwordMatch = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    return {
      found: true,
      userId: user.id,
      username: user.username,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordMatch,
      status: user.status,
      role: user.role,
    };
  }

  @Public()
  @SkipThrottle()
  @Post('create-corporate-contacts')
  async createCorporateContacts() {
    const corporateContacts = [
      { name: 'Pamela Chavarria', phone: '+50688284915', role: 'Team' },
      { name: 'Marcello Allegra', phone: '+50687057802', role: 'Management' },
      { name: 'Marcela Robles', phone: '+50683878226', role: 'Team' },
      { name: 'Team Administración', phone: '+50683419449', role: 'Administration' },
      { name: 'Bodega', phone: '+50663472858', role: 'Bodega' },
      { name: 'Goodlife Sabana', phone: '+50689784900', role: 'Team' },
      { name: 'Goodlife Lindora', phone: '+50689784910', role: 'Team' },
      { name: 'Michael Streda', phone: '+50671315444', role: 'Management' },
      { name: 'Erick Marchena', phone: '+50686815653', role: 'Team' },
      { name: 'Yeudy Araya Herrera', phone: '+50685323054', role: 'Team' },
      { name: 'Brandon Cookhorn Etiplast', phone: '+50661386837', role: 'Team' },
    ];

    const messages = [
      'Hola, buenos días! 👋',
      'Necesito acceso al sistema por favor',
      'Reportándome desde mi ubicación 📱',
      'Buenos días equipo! Listo para trabajar ✅',
      'Tengo una consulta sobre el inventario',
    ];

    try {
      // Find GoodLife account
      const account = await this.prisma.account.findFirst({
        where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
      });

      if (!account) {
        return { success: false, error: 'GoodLife account not found' };
      }

      // Find GoodLife inbox
      const inbox = await this.prisma.inbox.findFirst({
        where: { accountId: account.id, channel: 'WHATSAPP' },
      });

      if (!inbox) {
        return { success: false, error: 'GoodLife inbox not found' };
      }

      const results = [];

      for (const contactData of corporateContacts) {
        // Check if contact exists
        let contact = await this.prisma.contact.findFirst({
          where: { accountId: account.id, phone: contactData.phone },
        });

        if (contact) {
          results.push({ name: contactData.name, status: 'already_exists' });
          continue;
        }

        // Create contact as corporate
        contact = await this.prisma.contact.create({
          data: {
            accountId: account.id,
            inboxId: inbox.id,
            phone: contactData.phone,
            name: contactData.name,
            isCorporate: true,
          },
        });

        // Create conversation
        const conversation = await this.prisma.conversation.create({
          data: {
            inboxId: inbox.id,
            contactId: contact.id,
            status: 'OPEN',
            lastActivityAt: new Date(),
          },
        });

        // Create initial message
        const message = messages[Math.floor(Math.random() * messages.length)];
        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'IN',
            channel: 'WHATSAPP',
            text: message,
            status: 'DELIVERED',
          },
        });

        results.push({ name: contactData.name, status: 'created' });
      }

      return {
        success: true,
        accountId: account.id,
        inboxId: inbox.id,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Public()
  @SkipThrottle()
  @Post('create-goodlife')
  async createGoodLife() {
    try {
      // Check if GoodLife account exists
      let account = await this.prisma.account.findFirst({
        where: {
          OR: [
            { name: { contains: 'Goodlife', mode: 'insensitive' } },
            { name: { contains: 'GoodLife', mode: 'insensitive' } },
          ],
        },
      });

      if (!account) {
        account = await this.prisma.account.create({
          data: {
            name: 'Goodlife Costa Rica',
            isDemo: false,
            tier: 'STARTER',
            status: 'ACTIVE',
          },
        });
      }

      // Check if user exists
      let user = await this.prisma.userAccount.findFirst({
        where: { username: 'goodlife.nexxaagents' },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
        user = await this.prisma.userAccount.create({
          data: {
            accountId: account.id,
            username: 'goodlife.nexxaagents',
            email: 'ventas@goodlifecr.com',
            passwordHash,
            name: 'GoodLife Agent',
            role: 'USER',
            status: 'ACTIVE',
          },
        });
      }

      return {
        success: true,
        accountId: account.id,
        userId: user.id,
        message: 'GoodLife created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
