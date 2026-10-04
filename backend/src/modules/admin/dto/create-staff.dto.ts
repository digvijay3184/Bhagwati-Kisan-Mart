import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @Length(2, 100, { message: 'name must be between 2 and 100 characters' })
  name: string;

  @Matches(/^(\+91)?[6-9]\d{9}$/, {
    message: 'phoneNumber must be a valid 10-digit Indian mobile number',
  })
  phoneNumber: string;

  @IsOptional()
  @IsEnum(['owner', 'staff'], { message: 'role must be either owner or staff' })
  role?: 'owner' | 'staff' = 'staff';
}
