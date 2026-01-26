import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Get all agent templates
   * Public endpoint - anyone can browse the catalog
   */
  @Get()
  @Public()
  async getAll() {
    return this.templatesService.getAll();
  }

  /**
   * Get templates by category
   */
  @Get('category/:category')
  @Public()
  async getByCategory(@Param('category') category: string) {
    return this.templatesService.getByCategory(category as any);
  }

  /**
   * Search templates
   */
  @Get('search')
  @Public()
  async search(@Query('q') query: string) {
    if (!query) {
      return [];
    }
    return this.templatesService.search(query);
  }

  /**
   * Get a single template by ID
   */
  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    return this.templatesService.getById(id);
  }
}
