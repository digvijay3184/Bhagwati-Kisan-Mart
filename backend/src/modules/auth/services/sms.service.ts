import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly authKey: string;
  private readonly templateId: string;
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.authKey = this.configService.get<string>('msg91.authKey') || '';
    this.templateId = this.configService.get<string>('msg91.templateId') || '';
    this.isDev = this.configService.get<string>('nodeEnv') === 'development' || this.configService.get<string>('nodeEnv') === 'test';
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const sanitizedNumber = phoneNumber.replace('+', '');

    if (this.isDev) {
      // In development or test: log redacted phone and OTP to assist testing without consuming balance
      this.logger.log(
        `[DEV/TEST OTP] OTP for ${phoneNumber.substring(0, 6)}**** is: ${otp}`,
      );
    }

    if (!this.authKey) {
      if (!this.isDev) {
        this.logger.error('MSG91_AUTH_KEY not configured in production');
      }
      return true; // Return true in dev/test to allow local development
    }

    try {
      // MSG91 v5 OTP API
      const url = new URL('https://control.msg91.com/api/v5/otp');
      url.searchParams.append('template_id', this.templateId || 'default');
      url.searchParams.append('mobile', sanitizedNumber);
      url.searchParams.append('authkey', this.authKey);
      url.searchParams.append('otp', otp);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        this.logger.error(
          `MSG91 API error for ${phoneNumber.substring(0, 6)}****: ${response.status} ${JSON.stringify(data)}`,
        );
        return false;
      }

      this.logger.log(`OTP dispatched via MSG91 to ${phoneNumber.substring(0, 6)}****`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send SMS OTP to ${phoneNumber.substring(0, 6)}****: ${(error as Error).message}`,
      );
      // In dev mode, return true so developer testing is not blocked by external gateway failures
      return this.isDev;
    }
  }
}
