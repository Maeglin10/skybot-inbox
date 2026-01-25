import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Public } from '../auth/decorators/public.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, AccountRole, AccountStatus } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateFeaturesDto } from './dto/update-features.dto';

@Controller('accounts')
@Public()
@UseGuards(ApiKeyGuard)
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async list(
    @Headers('x-client-key') clientKey: string,
    @Query() query: ListAccountsDto,
  ) {
    this.logger.log(`GET /accounts clientKey=${clientKey} role=${query.role} status=${query.status}`);
    return this.accountsService.findAll(clientKey, query.role, query.status);
  }

  @Get('admins')
  async listAdmins(@Headers('x-client-key') clientKey: string) {
    this.logger.log(`GET /accounts/admins clientKey=${clientKey}`);
    return this.accountsService.findAll(clientKey, AccountRole.ADMIN);
  }

  @Get('users')
  async listUsers(@Headers('x-client-key') clientKey: string) {
    this.logger.log(`GET /accounts/users clientKey=${clientKey}`);
    return this.accountsService.findAll(clientKey, AccountRole.USER);
  }

  @Get(':id')
  async findOne(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`GET /accounts/${id} clientKey=${clientKey}`);
    return this.accountsService.findOne(clientKey, id);
  }

  @Post()
  async create(
    @Headers('x-client-key') clientKey: string,
    @Body() dto: CreateAccountDto,
  ) {
    this.logger.log(`POST /accounts clientKey=${clientKey} role=${dto.role}`);
    return this.accountsService.create(clientKey, dto);
  }

  @Patch(':id')
  async update(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    this.logger.log(`PATCH /accounts/${id} clientKey=${clientKey}`);
    return this.accountsService.update(clientKey, id, dto);
  }

  @Delete(':id')
  async delete(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`DELETE /accounts/${id} clientKey=${clientKey}`);
    return this.accountsService.delete(clientKey, id);
  }

  @Post(':id/suspend')
  async suspend(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`POST /accounts/${id}/suspend clientKey=${clientKey}`);
    return this.accountsService.suspend(clientKey, id);
  }

  @Post(':id/activate')
  async activate(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`POST /accounts/${id}/activate clientKey=${clientKey}`);
    return this.accountsService.activate(clientKey, id);
  }

  @Post(':id/promote')
  async promoteToAdmin(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`POST /accounts/${id}/promote clientKey=${clientKey}`);
    return this.accountsService.promoteToAdmin(clientKey, id);
  }

  @Post(':id/demote')
  async demoteToUser(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`POST /accounts/${id}/demote clientKey=${clientKey}`);
    return this.accountsService.demoteToUser(clientKey, id);
  }

  @Post(':id/change-password')
  async changePassword(
    @Headers('x-client-key') clientKey: string,
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    this.logger.log(`POST /accounts/${id}/change-password clientKey=${clientKey}`);
    return this.accountsService.changePassword(clientKey, id, dto);
  }

  @Post('verify')
  async verifyPassword(
    @Headers('x-client-key') clientKey: string,
    @Body() body: { email: string; password: string },
  ) {
    this.logger.log(`POST /accounts/verify clientKey=${clientKey} email=${body.email}`);
    const account = await this.accountsService.verifyPassword(clientKey, body.email, body.password);
    if (!account) {
      return { success: false, message: 'Invalid credentials' };
    }
    return { success: true, account };
  }

  /**
   * GET /accounts/:accountId/features
   * Get account features
   */
  @Get(':accountId/features')
  async getFeatures(@Param('accountId') accountId: string) {
    this.logger.log(`GET /accounts/${accountId}/features`);
    return this.accountsService.getFeatures(accountId);
  }

  /**
   * PATCH /accounts/:accountId/features
   * Update account features
   */
  @Patch(':accountId/features')
  async updateFeatures(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateFeaturesDto,
  ) {
    this.logger.log(`PATCH /accounts/${accountId}/features`);
    return this.accountsService.updateFeatures(accountId, dto);
  }
}
