import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Products E2E & HTTP Pipeline Test', () => {
  let app: INestApplication;
  let mockDbService: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test_secret_for_testing_12345';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_testing_67890';

    mockDbService = {
      query: jest.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve({
            rows: [{ total: 2 }],
            rowCount: 1,
          });
        }
        if (sql.includes('SELECT') && sql.includes('FROM products')) {
          if (params.includes('non-existent-id')) {
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          if (params.includes('prod-uuid-1')) {
            return Promise.resolve({
              rows: [
                {
                  id: 'prod-uuid-1',
                  name: 'Urea Fertilizer 45kg',
                  category: 'fertilizer',
                  brand: 'IFFCO',
                  description: 'Nitrogenous fertilizer',
                  dosage_info: '50kg per acre',
                  price: '266.50',
                  mrp: '266.50',
                  stock_qty: 100,
                  hsn_code: '31021000',
                  gst_rate: '5.00',
                  image_urls: ['https://example.com/urea.jpg'],
                  is_active: true,
                  created_at: new Date('2026-08-01T00:00:00Z'),
                  updated_at: new Date('2026-08-01T00:00:00Z'),
                },
              ],
              rowCount: 1,
            });
          }
          return Promise.resolve({
            rows: [
              {
                id: 'prod-uuid-1',
                name: 'Urea Fertilizer 45kg',
                category: 'fertilizer',
                brand: 'IFFCO',
                description: 'Nitrogenous fertilizer',
                dosage_info: '50kg per acre',
                price: '266.50',
                mrp: '266.50',
                stock_qty: 100,
                hsn_code: '31021000',
                gst_rate: '5.00',
                image_urls: ['https://example.com/urea.jpg'],
                is_active: true,
                created_at: new Date('2026-08-01T00:00:00Z'),
                updated_at: new Date('2026-08-01T00:00:00Z'),
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
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/products - should return enveloped paginated product list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products?page=1&limit=10')
      .expect(200);

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          expect.objectContaining({
            id: 'prod-uuid-1',
            name: 'Urea Fertilizer 45kg',
            category: 'fertilizer',
            brand: 'IFFCO',
            price: 266.5,
            mrp: 266.5,
            inStock: true,
            stockQty: 100,
          }),
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
      error: null,
    });
  });

  it('GET /api/v1/products/:id - should return single product detail with envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/prod-uuid-1')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'prod-uuid-1',
        name: 'Urea Fertilizer 45kg',
        category: 'fertilizer',
        brand: 'IFFCO',
      }),
      error: null,
    });
  });

  it('GET /api/v1/products/:id - should return 404 envelope when product not found', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products/non-existent-id')
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: {
        message: 'Product with ID "non-existent-id" not found',
        code: 'Not Found',
      },
    });
  });

  it('GET /api/v1/products?category=invalid_category - should return 400 validation error', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/products?category=unknown_crop_spray')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('Bad Request');
    expect(response.body.error.message).toContain('category must be one of');
  });
});
