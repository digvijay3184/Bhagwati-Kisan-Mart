import { Test, TestingModule } from '@nestjs/testing';
import { ProductsRepository } from './products.repository';
import { DatabaseService } from '@database/database.service';
import { ProductCategory } from './dto/product-category.enum';

describe('ProductsRepository (PRD Section 2.5.1 & 2.5.3)', () => {
  let repository: ProductsRepository;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const mockDb = {
      query: jest.fn(),
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<ProductsRepository>(ProductsRepository);
    databaseService = module.get(DatabaseService);
  });

  describe('findActive', () => {
    it('should query active products with default pagination', async () => {
      databaseService.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 } as any) // count query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'p1',
              name: 'Seed P1',
              category: ProductCategory.SEED,
              brand: 'BrandX',
              price: 100,
              mrp: 120,
              stock_qty: 10,
              is_active: true,
            },
          ],
          rowCount: 1,
        } as any); // data query

      const result = await repository.findActive({ page: 1, limit: 20, offset: 0 });

      expect(databaseService.query).toHaveBeenCalledTimes(2);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should append category and brand filter to SQL query', async () => {
      databaseService.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await repository.findActive({
        page: 1,
        limit: 10,
        offset: 0,
        category: ProductCategory.FERTILIZER,
        brand: 'IFFCO',
      });

      const countCall = databaseService.query.mock.calls[0];
      expect(countCall[0]).toContain('category = $1');
      expect(countCall[0]).toContain('brand ILIKE $2');
      expect(countCall[1]).toEqual([ProductCategory.FERTILIZER, '%IFFCO%']);
    });
  });

  describe('atomicDecrementStock (PRD Section 2.5.3 Concurrency Safety)', () => {
    it('should return true when atomic update succeeds', async () => {
      databaseService.query.mockResolvedValueOnce({
        rows: [{ id: 'p1' }],
        rowCount: 1,
      } as any);

      const success = await repository.atomicDecrementStock('p1', 5);

      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('stock_qty = stock_qty - $1'),
        [5, 'p1'],
      );
      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $2 AND stock_qty >= $1 AND is_active = true'),
        [5, 'p1'],
      );
      expect(success).toBe(true);
    });

    it('should return false when stock is insufficient or product inactive', async () => {
      databaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const success = await repository.atomicDecrementStock('p1', 50);

      expect(success).toBe(false);
    });
  });
});
