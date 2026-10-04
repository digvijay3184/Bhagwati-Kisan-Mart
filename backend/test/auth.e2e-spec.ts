import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/database/redis.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AuthModule E2E Test (Phone/OTP, Rate Limiting & JWT Protected Routes)', () => {
  let app: INestApplication;
  let inMemoryRedis: Map<string, string>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_for_testing_1234567890_min32';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_testing_1234567890_min32';

    inMemoryRedis = new Map<string, string>();

    const mockRedisService = {
      get: jest.fn().mockImplementation((key: string) => Promise.resolve(inMemoryRedis.get(key) || null)),
      set: jest.fn().mockImplementation((key: string, value: string) => {
        inMemoryRedis.set(key, value);
        return Promise.resolve();
      }),
      del: jest.fn().mockImplementation((key: string) => {
        inMemoryRedis.delete(key);
        return Promise.resolve();
      }),
      incr: jest.fn().mockImplementation((key: string) => {
        const val = parseInt(inMemoryRedis.get(key) || '0', 10) + 1;
        inMemoryRedis.set(key, val.toString());
        return Promise.resolve(val);
      }),
      getClient: jest.fn().mockReturnValue(null),
    };

    const mockDbService = {
      query: jest.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('FROM users') && sql.includes('phone_number = $1')) {
          return Promise.resolve({
            rows: [
              {
                id: 'usr-test-uuid',
                phone_number: params[0],
                name: 'Kisan Ramesh',
                address: 'Village Ramnagar',
                pincode: '226001',
                district: 'Lucknow',
                region: 'Awadh',
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          });
        }
        if (sql.includes('FROM users') && sql.includes('WHERE id = $1')) {
          return Promise.resolve({
            rows: [
              {
                id: 'usr-test-uuid',
                phone_number: '+919876543210',
                name: 'Kisan Ramesh',
                address: 'Village Ramnagar',
                pincode: '226001',
                district: 'Lucknow',
                region: 'Awadh',
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          });
        }
        if (sql.includes('INSERT INTO users')) {
          return Promise.resolve({
            rows: [
              {
                id: 'usr-test-uuid',
                phone_number: params[0],
                name: 'Kisan Ramesh',
                address: 'Village Ramnagar',
                pincode: '226001',
                district: 'Lucknow',
                region: 'Awadh',
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
      getClient: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDbService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/otp/send - should reject invalid phone numbers with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ phoneNumber: '12345' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('Bad Request');
    expect(res.body.error.message).toContain('Please provide a valid 10-digit Indian mobile number');
  });

  it('POST /api/v1/auth/otp/send - should send OTP and return 200 with cooldown', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ phoneNumber: '9876543210' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('OTP sent successfully');
    expect(res.body.data.cooldownSeconds).toBe(60);
  });

  it('POST /api/v1/auth/otp/send - should enforce 60s cooldown with 429 status', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ phoneNumber: '9876543210' })
      .expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Please wait 60 seconds before requesting another OTP');
  });

  it('POST /api/v1/auth/otp/verify - should reject invalid OTP with 401', async () => {
    // Clear cooldown to verify
    inMemoryRedis.delete('otp_cooldown:+919876543210');

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phoneNumber: '9876543210', otp: '000000' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid OTP');
  });

  it('POST /api/v1/auth/otp/verify - should verify valid OTP, return tokens and user profile', async () => {
    const crypto = require('crypto');
    const secret = 'test_secret_for_testing_1234567890_min32';
    const testOtp = '654321';
    const validHash = crypto.createHmac('sha256', secret).update(testOtp).digest('hex');

    inMemoryRedis.set('otp:+919876543210', validHash);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phoneNumber: '9876543210', otp: testOtp })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.phoneNumber).toBe('+919876543210');
    expect(res.body.data.user.name).toBe('Kisan Ramesh');

    // Test protected route GET /api/v1/auth/me with access token
    const accessToken = res.body.data.tokens.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.phoneNumber).toBe('+919876543210');
    expect(meRes.body.data.role).toBe('customer');

    // Test protected route without token -> 401
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
  });
});
