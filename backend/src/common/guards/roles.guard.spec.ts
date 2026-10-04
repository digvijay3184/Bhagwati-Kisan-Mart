import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('should allow access if no roles are required on route', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createMockContext({ role: 'customer' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access if user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner', 'staff']);
    const ctx = createMockContext({ role: 'staff' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner']);
    const ctx = createMockContext({ role: 'staff' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner']);
    const ctx = createMockContext(null);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
