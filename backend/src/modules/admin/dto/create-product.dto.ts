import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../../products/dto/product-category.enum';

export class CreateProductDto {
  @IsString()
  @Length(2, 255, { message: 'name must be between 2 and 255 characters' })
  name: string;

  @IsEnum(ProductCategory, { message: 'category must be a valid product category' })
  category: ProductCategory;

  @IsString()
  @Length(2, 255, { message: 'brand must be between 2 and 255 characters' })
  brand: string;

  @IsOptional()
  @IsString()
  @Length(5, 5000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(5, 2000)
  dosageInfo?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'price must be greater than 0' })
  price: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'mrp must be greater than 0' })
  mrp: number;

  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'stockQty cannot be negative' })
  stockQty: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  hsnCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gstRate?: number = 0;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true, message: 'each image URL must be a valid URL' })
  imageUrls?: string[] = [];
}
