import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination.dto';
import { ProductCategory } from './product-category.enum';

export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProductCategory, {
    message:
      'category must be one of: insecticide, fungicide, herbicide, bactericide, nematicide, pgr, seed, fertilizer',
  })
  category?: ProductCategory;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
