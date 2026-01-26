import { Controller, Get, Post } from '@nestjs/common';
import { MediaService } from './media.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async listMedia(@CurrentUser() user: any) {
    return this.mediaService.listMedia(user.accountId);
  }

  @Post('upload-url')
  async getUploadUrl(@CurrentUser() user: any) {
    return this.mediaService.uploadUrl(user.accountId);
  }
}
