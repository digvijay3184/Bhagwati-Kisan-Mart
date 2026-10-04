import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @Type(() => Number)
  @IsInt({ message: 'stockQty must be an integer' })
  @Min(0, { message: 'stockQty cannot be negative' })
  stockQty: number;
}
