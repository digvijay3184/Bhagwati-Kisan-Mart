import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RedisService } from '@database/redis.service';
import { UsersRepository } from '../users/users.repository';
import { AdminRepository } from '../admin/admin.repository';
import { SmsService } from './services/sms.service';

describe('AuthService (PRD Section 2.4 Phone/OTP & Rate Limiting)', () => {
  let service: AuthService;
  let redisService: jest.Mocked<RedisService>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let adminRepository: jest.Mocked<AdminRepository>;
  let smsService: jest.Mocked<SmsService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
    };

    const mockUsers = {
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockAdmin = {
      findAdminByPhoneNumber: jest.fn().mockResolvedValue(null),
    };

    const mockSms = {
      sendOtp: jest.fn().mockResolvedValue(true),
    };

    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
      verify: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.secret') return 'test_jwt_secret_32_chars_long!!';
        if (key === 'jwt.expiresIn') return '15m';
        if (key === 'jwt.refreshSecret') return 'test_refresh_secret_32_chars!!';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: JwtService, useValue: mockJwt },
        { provide: RedisService, useValue: mockRedis },
        { provide: UsersRepository, useValue: mockUsers },
        { provide: AdminRepository, useValue: mockAdmin },
        { provide: SmsService, useValue: mockSms },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    redisService = module.get(RedisService);
    usersRepository = module.get(UsersRepository);
    smsService = module.get(SmsService);
    jwtService = module.get(JwtService);
  });

  describe('sendOtp', () => {
    const testPhone = '+919876543210';

    it('should successfully send OTP and set Redis rate limits', async () => {
      redisService.get.mockResolvedValueOnce(null); // no cooldown
      redisService.incr.mockResolvedValueOnce(1); // 1st request this hour

      const result = await service.sendOtp(testPhone);

      expect(result.cooldownSeconds).toBe(60);
      expect(redisService.set).toHaveBeenCalledWith(
        `otp:${testPhone}`,
        expect.any(String),
        300,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `otp_cooldown:${testPhone}`,
        '1',
        60,
      );
      expect(smsService.sendOtp).toHaveBeenCalledWith(testPhone, expect.any(String));
    });

    it('should throw 429 if OTP requested during cooldown period', async () => {
      redisService.get.mockResolvedValueOnce('1'); // in cooldown

      await expect(service.sendOtp(testPhone)).rejects.toThrow(
        new HttpException(
          'Please wait 60 seconds before requesting another OTP',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should throw 429 if hourly rate limit exceeded', async () => {
      redisService.get.mockResolvedValueOnce(null); // no cooldown
      redisService.incr.mockResolvedValueOnce(6); // > 5 requests in hour

      await expect(service.sendOtp(testPhone)).rejects.toThrow(
        new HttpException(
          'Too many OTP requests for this phone number. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });
  });

  describe('verifyOtp', () => {
    const testPhone = '+919876543210';
    const testOtp = '123456';

    it('should throw BadRequestException if OTP attempts exceeded 5', async () => {
      redisService.get.mockResolvedValueOnce('5'); // attempts >= 5

      await expect(service.verifyOtp(testPhone, testOtp)).rejects.toThrow(
        BadRequestException,
      );
      expect(redisService.del).toHaveBeenCalledWith(`otp:${testPhone}`);
    });

    it('should throw BadRequestException if OTP expired or not in Redis', async () => {
      redisService.get
        .mockResolvedValueOnce('0') // attempts: 0
        .mockResolvedValueOnce(null); // stored hash is null

      await expect(service.verifyOtp(testPhone, testOtp)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException and increment attempts if OTP is incorrect', async () => {
      redisService.get
        .mockResolvedValueOnce('0') // attempts
        .mockResolvedValueOnce('some_different_hash'); // hash mismatch

      await expect(service.verifyOtp(testPhone, testOtp)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.incr).toHaveBeenCalledWith(`otp_attempts:${testPhone}`);
    });

    it('should verify correct OTP, create user if new, and issue tokens', async () => {
      // Compute expected hash using same secret
      const crypto = require('crypto');
      const expectedHash = crypto
        .createHmac('sha256', 'test_jwt_secret_32_chars_long!!')
        .update(testOtp)
        .digest('hex');

      redisService.get
        .mockResolvedValueOnce('0') // attempts
        .mockResolvedValueOnce(expectedHash); // stored hash

      usersRepository.findByPhoneNumber.mockResolvedValueOnce(null);
      usersRepository.create.mockResolvedValueOnce({
        id: 'new-user-uuid',
        phone_number: testPhone,
        name: null,
        address: null,
        pincode: null,
        district: null,
        region: null,
        created_at: new Date(),
      });

      const response = await service.verifyOtp(testPhone, testOtp);

      expect(response.tokens.accessToken).toBe('mock_jwt_token');
      expect(response.tokens.refreshToken).toBe('mock_jwt_token');
      expect(response.user.id).toBe('new-user-uuid');
      expect(response.user.phoneNumber).toBe(testPhone);
      expect(response.user.isProfileComplete).toBe(false);
      expect(redisService.del).toHaveBeenCalledWith(`otp:${testPhone}`);
    });
  });

  describe('logout', () => {
    it('should delete refresh token from Redis', async () => {
      const res = await service.logout('user-123');
      expect(redisService.del).toHaveBeenCalledWith('refresh_token:user-123');
      expect(res.message).toBe('Logged out successfully');
    });
  });
});
