import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateStoryDto) {
    return this.storiesService.create(user.accountId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.storiesService.findAll(user.accountId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.storiesService.findOne(id, user.accountId);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.storiesService.delete(id, user.accountId);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.storiesService.publish(id);
  }
}
