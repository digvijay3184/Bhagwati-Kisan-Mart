import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy (PRD Section 2.4 Token Validation)', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const mockConfig: any = {
      get: jest.fn().mockReturnValue('test_secret_for_jwt_testing_32_chars!'),
    };
    strategy = new JwtStrategy(mockConfig);
  });

  it('should validate and return user payload', async () => {
    const payload: JwtPayload = {
      sub: 'usr-123',
      phone: '+919876543210',
      role: 'customer',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 'usr-123',
      phoneNumber: '+919876543210',
      role: 'customer',
    });
  });

  it('should throw UnauthorizedException if sub or phone is missing', async () => {
    const invalidPayload: any = { sub: 'usr-123' };

    await expect(strategy.validate(invalidPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
