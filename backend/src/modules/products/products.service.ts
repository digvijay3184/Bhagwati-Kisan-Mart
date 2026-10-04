import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async getProducts(
    query: ProductQueryDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const { items, total } = await this.productsRepository.findActive(query);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((item) => ProductResponseDto.fromEntity(item)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return ProductResponseDto.fromEntity(product);
  }
}
