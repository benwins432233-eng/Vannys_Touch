import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto/product.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5 MB max, 10 images max
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public routes ─────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination (public)' })
  findAll(@Query() filters: ProductFilterDto) {
    return this.productsService.findAll(filters);
  }

  // Déclarée AVANT `:slug` : « filters » serait sinon pris pour un slug produit.
  @Public()
  @Get('filters')
  @ApiOperation({ summary: 'Valeurs de filtre réellement disponibles (public)' })
  findFilters() {
    return this.productsService.findFilters();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug (public)' })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ── Admin routes ──────────────────────────────────────────

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadOptions))
  @ApiOperation({ summary: '[Admin] Create product with images' })
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productsService.create(dto, images ?? []);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadOptions))
  @ApiOperation({ summary: '[Admin] Update product' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.productsService.update(id, dto, images ?? []);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete product and Cloudinary images' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Delete('images/:imageId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete a single product image' })
  deleteImage(@Param('imageId') imageId: string) {
    return this.productsService.deleteImage(imageId);
  }

  @Patch('images/:imageId/primary')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Set image as primary' })
  setPrimary(@Param('imageId') imageId: string) {
    return this.productsService.setPrimaryImage(imageId);
  }
}
