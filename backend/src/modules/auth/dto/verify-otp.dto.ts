import { IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(?:\+91|91)?[6-9]\d{9}$/, {
    message: 'Please provide a valid 10-digit Indian mobile number',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    return `+91${cleaned}`;
  })
  phoneNumber: string;

  @IsNotEmpty({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}
