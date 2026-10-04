import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/database/redis.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('UsersModule E2E Test (Profile Management & Protected Routes)', () => {
  let app: INestApplication;
  const jwtSecret = 'test_secret_for_testing_1234567890_min32';
  const testUserId = 'usr-test-uuid-123';
  const testPhone = '+919876543210';

  let currentUserData = {
    id: testUserId,
    phone_number: testPhone,
    name: 'Kisan Ramesh',
    address: 'Village Ramnagar, Post Bilhaur',
    pincode: '209202',
    district: 'Kanpur Nagar',
    region: 'Kanpur',
    created_at: new Date('2026-01-01T00:00:00Z'),
  };

  const validToken = jwt.sign(
    {
      sub: testUserId,
      phone: testPhone,
      role: 'customer',
    },
    jwtSecret,
    { expiresIn: '15m' },
  );

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/test';
    process.env.JWT_SECRET = jwtSecret;
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_testing_1234567890_min32';

    const mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn().mockResolvedValue(1),
      getClient: jest.fn().mockReturnValue(null),
    };

    const mockDbService = {
      query: jest.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('FROM users') && sql.includes('WHERE id = $1')) {
          if (params[0] === testUserId) {
            return Promise.resolve({
              rows: [currentUserData],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }

        if (sql.includes('UPDATE users')) {
          const id = params[params.length - 1];
          if (id === testUserId) {
            // Apply partial updates
            if (sql.includes('name = $1')) currentUserData.name = params[0];
            if (sql.includes('address = $2')) currentUserData.address = params[1];
            if (sql.includes('pincode = $3')) currentUserData.pincode = params[2];
            if (sql.includes('district = $4')) currentUserData.district = params[3];
            return Promise.resolve({
              rows: [currentUserData],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
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

  it('GET /api/v1/users/profile - should return 401 Unauthorized when no token provided', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/users/profile - should return 200 with user profile when token is valid', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testUserId);
    expect(res.body.data.phoneNumber).toBe(testPhone);
    expect(res.body.data.name).toBe('Kisan Ramesh');
    expect(res.body.data.isProfileComplete).toBe(true);
  });

  it('PATCH /api/v1/users/profile - should return 400 when pincode format is invalid', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ pincode: 'invalid_code' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Pincode must be a valid 6-digit Indian postal code');
  });

  it('PATCH /api/v1/users/profile - should update profile with valid payload and return updated data', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Ramesh Kumar Patel',
        address: 'House 12, Main Bazar, Bilhaur',
        pincode: '209202',
        district: 'Kanpur Nagar',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Ramesh Kumar Patel');
    expect(res.body.data.address).toBe('House 12, Main Bazar, Bilhaur');
  });

  it('GET /api/v1/users/profile - should return 404 for non-existent user token', async () => {
    const unknownToken = jwt.sign(
      { sub: 'usr-unknown', phone: '+919999999999', role: 'customer' },
      jwtSecret,
      { expiresIn: '15m' },
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${unknownToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('User with ID "usr-unknown" not found');
  });
});
