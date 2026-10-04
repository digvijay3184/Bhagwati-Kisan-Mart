import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(5, 300, { message: 'Address must be between 5 and 300 characters' })
  address?: string;

  @IsOptional()
  @Matches(/^[1-9][0-9]{5}$/, {
    message: 'Pincode must be a valid 6-digit Indian postal code',
  })
  pincode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'District must be between 2 and 100 characters' })
  district?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Region must be between 2 and 100 characters' })
  region?: string;
}
