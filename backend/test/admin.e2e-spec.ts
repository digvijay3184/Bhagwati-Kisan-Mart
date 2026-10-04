import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/database/redis.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AdminModule E2E Test (Role-Based Access Control, Order State & Catalog Admin)', () => {
  let app: INestApplication;
  const jwtSecret = 'test_secret_for_testing_1234567890_min32';

  const customerToken = jwt.sign(
    { sub: 'usr-customer-1', phone: '+919876543210', role: 'customer' },
    jwtSecret,
    { expiresIn: '15m' },
  );

  const staffToken = jwt.sign(
    { sub: 'usr-staff-1', phone: '+919876543222', role: 'staff' },
    jwtSecret,
    { expiresIn: '15m' },
  );

  const ownerToken = jwt.sign(
    { sub: 'usr-owner-1', phone: '+919876543233', role: 'owner' },
    jwtSecret,
    { expiresIn: '15m' },
  );

  let currentOrderStatus = 'placed';
  let productStock = 50;
  let productIsActive = true;

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
      getClient: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
        release: jest.fn(),
      }),
      query: jest.fn().mockImplementation((sql: string, params: any[]) => {
        // 1. Staff query
        if (sql.includes('INSERT INTO admin_users')) {
          return Promise.resolve({
            rows: [
              {
                id: 's-1',
                name: params[0],
                phone_number: params[1],
                role: params[2],
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          });
        }

        if (sql.includes('FROM admin_users WHERE phone_number = $1')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }

        // 2. Orders list query
        if (sql.includes('SELECT COUNT(*) AS total FROM orders')) {
          return Promise.resolve({ rows: [{ total: 1 }], rowCount: 1 });
        }

        if (sql.includes('FROM orders o') && sql.includes('JOIN users u')) {
          return Promise.resolve({
            rows: [
              {
                id: 'b6e3f524-77f2-4cf3-9467-3ce942d45a70',
                user_id: 'usr-customer-1',
                status: currentOrderStatus,
                fulfillment_type: 'delivery',
                total_amount: 1200,
                payment_status: 'pending',
                payment_method: 'cod',
                gst_invoice_no: 'BKM-INV-2026-112233',
                idempotency_key: null,
                created_at: new Date(),
                customer: {
                  id: 'usr-customer-1',
                  phoneNumber: '+919876543210',
                  name: 'Kisan Ramesh',
                },
                items: [],
              },
            ],
            rowCount: 1,
          });
        }

        // 3. Order lookup by ID
        if (sql.includes('FROM orders o') && sql.includes('WHERE o.id = $1')) {
          return Promise.resolve({
            rows: [
              {
                id: params[0],
                user_id: 'usr-customer-1',
                status: currentOrderStatus,
                fulfillment_type: 'delivery',
                total_amount: 1200,
                payment_status: 'pending',
                payment_method: 'cod',
                gst_invoice_no: 'BKM-INV-2026-112233',
                idempotency_key: null,
                created_at: new Date(),
                items: [],
              },
            ],
            rowCount: 1,
          });
        }

        // 4. Update order status
        if (sql.includes('UPDATE orders') && sql.includes('SET status = $1')) {
          currentOrderStatus = params[0];
          return Promise.resolve({
            rows: [
              {
                id: params[1],
                user_id: 'usr-customer-1',
                status: currentOrderStatus,
                fulfillment_type: 'delivery',
                total_amount: 1200,
                payment_status: 'pending',
                payment_method: 'cod',
                gst_invoice_no: 'BKM-INV-2026-112233',
                idempotency_key: null,
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          });
        }

        // 5. Product queries
        if (sql.includes('INSERT INTO products')) {
          return Promise.resolve({
            rows: [
              {
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: params[0],
                category: params[1],
                brand: params[2],
                price: params[5],
                mrp: params[6],
                stock_qty: params[7],
                is_active: true,
              },
            ],
            rowCount: 1,
          });
        }

        if (sql.includes('UPDATE products') && sql.includes('SET stock_qty = $1')) {
          productStock = params[0];
          return Promise.resolve({
            rows: [{ id: params[1], stock_qty: productStock }],
            rowCount: 1,
          });
        }

        if (sql.includes('UPDATE products') && sql.includes('is_active = false')) {
          productIsActive = false;
          return Promise.resolve({
            rows: [{ id: params[0], is_active: false }],
            rowCount: 1,
          });
        }

        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
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

  describe('Role-Based Access Control', () => {
    it('GET /api/v1/admin/orders - should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .expect(401);
    });

    it('GET /api/v1/admin/orders - should return 403 Forbidden for customer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Access denied');
    });

    it('GET /api/v1/admin/orders - should return 200 OK for staff token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('DELETE /api/v1/admin/products/:id - should return 403 Forbidden for staff token (owner only)', async () => {
      const productId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Access denied');
    });

    it('DELETE /api/v1/admin/products/:id - should return 200 OK for owner token', async () => {
      const productId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(productIsActive).toBe(false);
    });
  });

  describe('Product Management', () => {
    it('POST /api/v1/admin/products - should create product with owner token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Indofil M-45 Fungicide',
          category: 'fungicide',
          brand: 'Indofil',
          price: 450,
          mrp: 500,
          stockQty: 30,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Indofil M-45 Fungicide');
    });

    it('PATCH /api/v1/admin/products/:id/stock - should update stock with staff token', async () => {
      const productId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/products/${productId}/stock`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ stockQty: 75 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(productStock).toBe(75);
    });
  });

  describe('Order State Machine Enforcement', () => {
    const orderId = 'b6e3f524-77f2-4cf3-9467-3ce942d45a70';

    it('PATCH /api/v1/admin/orders/:id/status - should reject invalid transition placed -> delivered with 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'delivered' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid order status transition');
    });

    it('PATCH /api/v1/admin/orders/:id/status - should advance placed -> confirmed with staff token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(currentOrderStatus).toBe('confirmed');
    });
  });

  describe('Staff Administration', () => {
    it('POST /api/v1/admin/staff - should create staff account with owner token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Rohan Sharma',
          phoneNumber: '9876543299',
          role: 'staff',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Rohan Sharma');
    });
  });
});
