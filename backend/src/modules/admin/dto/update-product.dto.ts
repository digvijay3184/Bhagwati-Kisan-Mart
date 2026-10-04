import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  brand?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(5, 2000)
  dosageInfo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  mrp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty?: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  hsnCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gstRate?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
