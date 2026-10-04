import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RedisService } from '@database/redis.service';
import { UsersRepository } from '../users/users.repository';
import { AdminRepository } from '../admin/admin.repository';
import { SmsService } from './services/sms.service';
import { LoginResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly usersRepository: UsersRepository,
    private readonly adminRepository: AdminRepository,
    private readonly smsService: SmsService,
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret') || 'fallback_secret';
    this.jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    this.jwtRefreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'fallback_refresh_secret';
    this.jwtRefreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
  }

  private hashOtp(otp: string): string {
    return crypto.createHmac('sha256', this.jwtSecret).update(otp).digest('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async sendOtp(phoneNumber: string): Promise<{ message: string; cooldownSeconds: number }> {
    const cooldownKey = `otp_cooldown:${phoneNumber}`;
    const countKey = `otp_count:${phoneNumber}`;
    const otpKey = `otp:${phoneNumber}`;
    const attemptsKey = `otp_attempts:${phoneNumber}`;

    const isDev =
      this.configService.get<string>('nodeEnv') === 'development' ||
      this.configService.get<string>('nodeEnv') === 'test';

    // 1. Rate limiting: Cooldown check (60s between sends in prod, relaxed in dev/test)
    const inCooldown = await this.redisService.get(cooldownKey);
    if (inCooldown && !isDev) {
      throw new HttpException(
        'Please wait 60 seconds before requesting another OTP',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Rate limiting: Hourly cap (max 5 requests per hour)
    const hourlyCount = await this.redisService.incr(countKey, 3600);
    if (hourlyCount > 5) {
      throw new HttpException(
        'Too many OTP requests for this phone number. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Cryptographically secure 6-digit OTP generation
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(otp);

    // 4. Store in Redis: TTL 300s (5 minutes)
    await this.redisService.set(otpKey, otpHash, 300);
    await this.redisService.set(attemptsKey, '0', 300);
    await this.redisService.set(cooldownKey, '1', 60);

    // 5. Dispatch SMS via MSG91
    await this.smsService.sendOtp(phoneNumber, otp);

    return {
      message: 'OTP sent successfully',
      cooldownSeconds: 60,
    };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<LoginResponseDto> {
    const otpKey = `otp:${phoneNumber}`;
    const attemptsKey = `otp_attempts:${phoneNumber}`;

    // 1. Check max failed attempts (max 5)
    const attemptsStr = await this.redisService.get(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    if (attempts >= 5) {
      await this.redisService.del(otpKey);
      await this.redisService.del(attemptsKey);
      throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
    }

    // 2. Check stored OTP hash
    const storedHash = await this.redisService.get(otpKey);
    if (!storedHash) {
      throw new BadRequestException('OTP has expired or was not requested.');
    }

    // 3. Validate OTP using timing-safe comparison
    const inputHash = this.hashOtp(otp);
    const inputBuffer = Buffer.from(inputHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    const isValid =
      inputBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(inputBuffer, storedBuffer);

    if (!isValid) {
      await this.redisService.incr(attemptsKey);
      const remaining = 5 - (attempts + 1);
      throw new UnauthorizedException(
        `Invalid OTP. ${remaining > 0 ? remaining + ' attempts remaining.' : 'Please request a new OTP.'}`,
      );
    }

    // 4. Success: Clean up OTP keys in Redis
    await this.redisService.del(otpKey);
    await this.redisService.del(attemptsKey);
    await this.redisService.del(`otp_cooldown:${phoneNumber}`);

    // 5. Find or create user in Supabase
    let user = await this.usersRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      user = await this.usersRepository.create(phoneNumber);
      this.logger.log(`Created new customer account for phone ${phoneNumber.substring(0, 6)}****`);
    }

    // 6. Check if user is an admin
    const adminUser = await this.adminRepository.findAdminByPhoneNumber(phoneNumber);
    const role: 'owner' | 'staff' | 'customer' = adminUser ? adminUser.role : 'customer';

    // 7. Issue JWT tokens
    const tokens = await this.generateTokens(user.id, user.phone_number, role);

    return {
      tokens,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        role,
        isProfileComplete: Boolean(user.name && user.pincode && user.district),
      },
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedHash = await this.redisService.get(`refresh_token:${payload.sub}`);
    if (!storedHash) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const incomingHash = this.hashToken(refreshToken);
    if (storedHash !== incomingHash) {
      // Possible token reuse attack: revoke immediately
      await this.redisService.del(`refresh_token:${payload.sub}`);
      this.logger.warn(`Potential refresh token reuse detected for user ${payload.sub}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate tokens
    return this.generateTokens(payload.sub, payload.phone, payload.role || 'customer');
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.redisService.del(`refresh_token:${userId}`);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    userId: string,
    phoneNumber: string,
    role: 'customer' | 'owner' | 'staff',
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    const payload: JwtPayload = { sub: userId, phone: phoneNumber, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiresIn,
    });

    // Store hashed refresh token in Redis with 7-day TTL (604800s)
    const tokenHash = this.hashToken(refreshToken);
    await this.redisService.set(`refresh_token:${userId}`, tokenHash, 7 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtExpiresIn,
    };
  }
}
