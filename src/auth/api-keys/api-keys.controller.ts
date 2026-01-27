import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '@prisma/client';
import {
  StandardRateLimit,
  RelaxedRateLimit,
  SensitiveRateLimit,
} from '../../common/rate-limit/rate-limit.decorators';

@Controller('api-keys')
@UseGuards(RolesGuard)
@Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN) // Only admins can manage API keys
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Generate a new API key
   * POST /api/api-keys
   */
  @SensitiveRateLimit()
  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.generateApiKey(
      user.accountId,
      dto.name,
      dto.expiresAt,
    );
  }

  /**
   * List all API keys for the current account
   * GET /api/api-keys
   */
  @RelaxedRateLimit()
  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.apiKeysService.listApiKeys(user.accountId);
  }

  /**
   * Get a specific API key by ID
   * GET /api/api-keys/:id
   */
  @RelaxedRateLimit()
  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.getApiKey(user.accountId, id);
  }

  /**
   * Rotate an API key (deactivate old, create new)
   * POST /api/api-keys/:id/rotate
   */
  @SensitiveRateLimit()
  @Post(':id/rotate')
  async rotate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.rotateApiKey(user.accountId, id);
  }

  /**
   * Revoke an API key (deactivate)
   * POST /api/api-keys/:id/revoke
   */
  @StandardRateLimit()
  @Post(':id/revoke')
  async revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.revokeApiKey(user.accountId, id);
  }

  /**
   * Delete an API key permanently
   * DELETE /api/api-keys/:id
   */
  @SensitiveRateLimit()
  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.deleteApiKey(user.accountId, id);
  }
}
