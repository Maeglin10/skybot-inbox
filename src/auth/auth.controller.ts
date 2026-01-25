import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Request,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { AuthService, LoginResponse, AuthUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard, IS_PUBLIC_KEY } from './jwt-auth.guard';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Headers('x-client-key') clientKey: string,
    @Body() dto: LoginDto,
  ): Promise<LoginResponse> {
    this.logger.log(`POST /auth/login email=${dto.email} clientKey=${clientKey}`);
    return this.authService.login(dto, clientKey);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any): Promise<AuthUser> {
    this.logger.log(`GET /auth/me userId=${req.user.id}`);
    return this.authService.getMe(req.user.id, req.user.clientKey);
  }
}
