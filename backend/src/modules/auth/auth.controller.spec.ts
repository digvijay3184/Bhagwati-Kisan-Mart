import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const mockAuthService = {
      sendOtp: jest.fn(),
      verifyOtp: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const mockUsersRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    usersRepository = module.get(UsersRepository);
  });

  it('should delegate sendOtp to AuthService', async () => {
    authService.sendOtp.mockResolvedValueOnce({
      message: 'OTP sent successfully',
      cooldownSeconds: 60,
    });

    const result = await controller.sendOtp({ phoneNumber: '+919876543210' });

    expect(authService.sendOtp).toHaveBeenCalledWith('+919876543210');
    expect(result.cooldownSeconds).toBe(60);
  });

  it('should delegate verifyOtp to AuthService', async () => {
    const expected = {
      tokens: { accessToken: 'at', refreshToken: 'rt', expiresIn: '15m' },
      user: { id: 'u1', phoneNumber: '+919876543210', name: null, role: 'customer' as const, isProfileComplete: false },
    };
    authService.verifyOtp.mockResolvedValueOnce(expected);

    const result = await controller.verifyOtp({
      phoneNumber: '+919876543210',
      otp: '123456',
    });

    expect(authService.verifyOtp).toHaveBeenCalledWith('+919876543210', '123456');
    expect(result).toBe(expected);
  });
});
