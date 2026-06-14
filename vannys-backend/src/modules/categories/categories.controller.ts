import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active categories (public)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug (public)' })
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all categories including inactive' })
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update category' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
