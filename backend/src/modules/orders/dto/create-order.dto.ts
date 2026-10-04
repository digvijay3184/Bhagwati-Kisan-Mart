import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FulfillmentType, PaymentMethod } from '../enums/order.enums';

export class CreateOrderItemDto {
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  productId: string;

  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  @Max(100, { message: 'quantity cannot exceed 100 per item' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'items must be an array of order items' })
  @ArrayMinSize(1, { message: 'order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsEnum(FulfillmentType, {
    message: 'fulfillmentType must be either "delivery" or "pickup"',
  })
  fulfillmentType: FulfillmentType;

  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be either "cod" or "online"',
  })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @Length(8, 100, {
    message: 'idempotencyKey must be between 8 and 100 characters',
  })
  idempotencyKey?: string;
}
