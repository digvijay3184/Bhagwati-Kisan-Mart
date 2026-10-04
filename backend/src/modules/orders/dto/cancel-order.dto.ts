import { IsOptional, IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @Length(2, 255, { message: 'reason must be between 2 and 255 characters' })
  reason?: string;
}
