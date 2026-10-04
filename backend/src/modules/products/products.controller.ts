import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedResult } from '@common/dto/pagination.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    return this.productsService.getProducts(query);
  }

  @Get(':id')
  async getProductById(
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.getProductById(id);
  }
}
