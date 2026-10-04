import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { RedisService } from '../src/database/redis.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('OrdersModule E2E Test (Concurrency-Safe Inventory, State Machine & Idempotency)', () => {
  let app: INestApplication;
  const jwtSecret = 'test_secret_for_testing_1234567890_min32';
  const customerUserId = 'usr-kisan-1';
  const intruderUserId = 'usr-intruder-2';
  const testPhone = '+919876543210';
  const productId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  let productStock = 10;
  const productPrice = 600.0;
  let storedOrders: any[] = [];
  let storedOrderItems: any[] = [];

  const customerToken = jwt.sign(
    { sub: customerUserId, phone: testPhone, role: 'customer' },
    jwtSecret,
    { expiresIn: '15m' },
  );

  const intruderToken = jwt.sign(
    { sub: intruderUserId, phone: '+919999888877', role: 'customer' },
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

    const mockClient = {
      query: jest.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }

        // Idempotency check
        if (sql.includes('SELECT id FROM orders WHERE idempotency_key = $1')) {
          const found = storedOrders.find((o) => o.idempotency_key === params[0]);
          return Promise.resolve({
            rows: found ? [{ id: found.id }] : [],
            rowCount: found ? 1 : 0,
          });
        }

        // Atomic stock decrement
        if (sql.includes('UPDATE products') && sql.includes('stock_qty = stock_qty - $1')) {
          const qty = params[0];
          const id = params[1];
          if (id === productId && productStock >= qty) {
            productStock -= qty;
            return Promise.resolve({
              rows: [
                {
                  id: productId,
                  name: 'Roundup Herbicide',
                  price: productPrice,
                  stock_qty: productStock,
                  is_active: true,
                },
              ],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }

        // Check product stock when decrement failed
        if (sql.includes('SELECT name, stock_qty, is_active FROM products WHERE id = $1')) {
          return Promise.resolve({
            rows: [
              {
                id: productId,
                name: 'Roundup Herbicide',
                price: productPrice,
                stock_qty: productStock,
                is_active: true,
              },
            ],
            rowCount: 1,
          });
        }

        // Insert order
        if (sql.includes('INSERT INTO orders')) {
          const newOrder = {
            id: 'b6e3f524-77f2-4cf3-9467-3ce942d45a70',
            user_id: params[0],
            status: params[1],
            fulfillment_type: params[2],
            total_amount: params[3],
            payment_status: params[4],
            payment_method: params[5],
            gst_invoice_no: params[6],
            idempotency_key: params[7],
            created_at: new Date(),
          };
          storedOrders.push(newOrder);
          return Promise.resolve({ rows: [newOrder], rowCount: 1 });
        }

        // Insert order items
        if (sql.includes('INSERT INTO order_items')) {
          const item = {
            id: 'item-uuid-1',
            order_id: params[0],
            product_id: params[1],
            product_name: 'Roundup Herbicide',
            quantity: params[2],
            unit_price: params[3],
            subtotal: params[4],
          };
          storedOrderItems.push(item);
          return Promise.resolve({ rows: [item], rowCount: 1 });
        }

        // Cancel order & restore stock
        if (sql.includes('UPDATE orders') && sql.includes('status = $1')) {
          const order = storedOrders.find((o) => o.id === params[1]);
          if (order) {
            order.status = params[0];
            return Promise.resolve({ rows: [order], rowCount: 1 });
          }
        }

        if (sql.includes('FROM order_items') && sql.includes('WHERE order_id = $1')) {
          const items = storedOrderItems.filter((i) => i.order_id === params[0]);
          return Promise.resolve({ rows: items, rowCount: items.length });
        }

        if (sql.includes('UPDATE products') && sql.includes('stock_qty = stock_qty + $1')) {
          const qty = params[0];
          productStock += qty;
          return Promise.resolve({ rows: [], rowCount: 1 });
        }

        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
      release: jest.fn(),
    };

    const mockDbService = {
      getClient: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn().mockImplementation((sql: string, params: any[]) => {
        // Users lookup
        if (sql.includes('FROM users') && sql.includes('WHERE id = $1')) {
          return Promise.resolve({
            rows: [
              {
                id: params[0],
                phone_number: testPhone,
                name: 'Kisan Ramesh',
                address: 'Village Bilhaur, GT Road',
                pincode: '209202',
                district: 'Kanpur Nagar',
                region: 'Kanpur',
                created_at: new Date(),
              },
            ],
            rowCount: 1,
          });
        }

        // Order lookup by ID or Idempotency Key
        if (sql.includes('FROM orders o') && (sql.includes('WHERE o.id = $1') || sql.includes('WHERE o.idempotency_key = $1'))) {
          const target = sql.includes('o.id = $1')
            ? storedOrders.find((o) => o.id === params[0])
            : storedOrders.find((o) => o.idempotency_key === params[0]);

          if (target) {
            const items = storedOrderItems.filter((i) => i.order_id === target.id);
            return Promise.resolve({
              rows: [{ ...target, items }],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }

        // Count orders by user_id
        if (sql.includes('COUNT(*)')) {
          const userOrders = storedOrders.filter((o) => o.user_id === params[0]);
          return Promise.resolve({ rows: [{ total: userOrders.length }], rowCount: 1 });
        }

        // Orders list by user_id
        if (sql.includes('FROM orders o') && sql.includes('o.user_id = $1')) {
          const userOrders = storedOrders.filter((o) => o.user_id === params[0]);
          const withItems = userOrders.map((o) => ({
            ...o,
            items: storedOrderItems.filter((i) => i.order_id === o.id),
          }));
          return Promise.resolve({ rows: withItems, rowCount: withItems.length });
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

  it('POST /api/v1/orders - should reject unauthenticated request with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        items: [{ productId, quantity: 1 }],
        fulfillmentType: 'delivery',
        paymentMethod: 'cod',
      })
      .expect(401);
  });

  it('POST /api/v1/orders - should create order with COD and delivery and decrement stock atomically', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId, quantity: 2 }],
        fulfillmentType: 'delivery',
        paymentMethod: 'cod',
        idempotencyKey: 'idem-test-token-12345',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('placed');
    expect(res.body.data.paymentStatus).toBe('pending');
    expect(res.body.data.paymentMethod).toBe('cod');
    expect(res.body.data.totalAmount).toBe(1200); // 2 * 600 + 0 (>= 1000 free delivery)
    expect(productStock).toBe(8); // decremented from 10 to 8
  });

  it('POST /api/v1/orders - should return identical order for repeated idempotency key without double decrement', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId, quantity: 2 }],
        fulfillmentType: 'delivery',
        paymentMethod: 'cod',
        idempotencyKey: 'idem-test-token-12345',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('b6e3f524-77f2-4cf3-9467-3ce942d45a70');
    expect(productStock).toBe(8); // Did not double decrement!
  });

  it('POST /api/v1/orders - should reject checkout with 409 Conflict if stock is insufficient', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId, quantity: 15 }], // only 8 left
        fulfillmentType: 'delivery',
        paymentMethod: 'cod',
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Insufficient stock');
    expect(productStock).toBe(8); // Stock unchanged
  });

  it('GET /api/v1/orders - should list customer orders with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it('GET /api/v1/orders/:id - should reject non-owner access with 403 Forbidden', async () => {
    const orderId = 'b6e3f524-77f2-4cf3-9467-3ce942d45a70';

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .expect(403);
  });

  it('PATCH /api/v1/orders/:id/cancel - should cancel placed order and restore stock atomically', async () => {
    const orderId = 'b6e3f524-77f2-4cf3-9467-3ce942d45a70';

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Ordered wrong herbicide quantity' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
    expect(productStock).toBe(10); // Restored from 8 to 10
  });
});
