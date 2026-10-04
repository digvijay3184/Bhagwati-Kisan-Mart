import { environmentValidationSchema } from './env.validation';

describe('Environment Validation (PRD Section 2.7 Fail-Fast)', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: 4000,
    DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/postgres',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'super_secret_jwt_access_token_min_16_chars',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'super_secret_jwt_refresh_token_min_16_chars',
    JWT_REFRESH_EXPIRES_IN: '7d',
  };

  it('should validate a complete valid configuration', () => {
    const { error, value } = environmentValidationSchema.validate(validEnv);
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(4000);
    expect(value.NODE_ENV).toBe('development');
  });

  it('should fail if DATABASE_URL is missing', () => {
    const { DATABASE_URL, ...invalidEnv } = validEnv;
    const { error } = environmentValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('"DATABASE_URL" is required');
  });

  it('should fail if JWT_SECRET is less than 16 characters', () => {
    const invalidEnv = { ...validEnv, JWT_SECRET: 'short' };
    const { error } = environmentValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('at least 16 characters long');
  });

  it('should fail if NODE_ENV is not one of development, production, test', () => {
    const invalidEnv = { ...validEnv, NODE_ENV: 'staging' };
    const { error } = environmentValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('must be one of [development, production, test]');
  });
});
