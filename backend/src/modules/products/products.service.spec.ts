import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { ProductCategory } from './dto/product-category.enum';
import { ProductEntity } from './entities/product.entity';

describe('ProductsService (PRD Section 2.3 & 2.4)', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;

  const mockProductEntity: ProductEntity = {
    id: 'prod-uuid-1',
    name: 'Chlorpyrifos 20% EC',
    category: ProductCategory.INSECTICIDE,
    brand: 'Tata Rallis',
    description: 'Broad spectrum organophosphate insecticide',
    dosage_info: '2ml per liter of water',
    price: 450.0,
    mrp: 500.0,
    stock_qty: 25,
    hsn_code: '380891',
    gst_rate: 18.0,
    image_urls: ['https://r2.bhagwatikisanmart.in/products/chlorpyrifos.jpg'],
    is_active: true,
    created_at: new Date('2026-08-01T00:00:00Z'),
    updated_at: new Date('2026-08-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockRepo = {
      findActive: jest.fn(),
      findById: jest.fn(),
      atomicDecrementStock: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(ProductsRepository);
  });

  describe('getProducts', () => {
    it('should return paginated products list with correct meta', async () => {
      repository.findActive.mockResolvedValue({
        items: [mockProductEntity],
        total: 1,
      });

      const result = await service.getProducts({
        page: 1,
        limit: 20,
        offset: 0,
      });

      expect(repository.findActive).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        offset: 0,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('prod-uuid-1');
      expect(result.items[0].name).toBe('Chlorpyrifos 20% EC');
      expect(result.items[0].inStock).toBe(true);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should calculate totalPages correctly for larger datasets', async () => {
      repository.findActive.mockResolvedValue({
        items: [mockProductEntity],
        total: 45,
      });

      const result = await service.getProducts({
        page: 2,
        limit: 20,
        offset: 20,
      });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('getProductById', () => {
    it('should return product DTO if product exists and is active', async () => {
      repository.findById.mockResolvedValue(mockProductEntity);

      const result = await service.getProductById('prod-uuid-1');

      expect(repository.findById).toHaveBeenCalledWith('prod-uuid-1');
      expect(result.id).toBe('prod-uuid-1');
      expect(result.category).toBe(ProductCategory.INSECTICIDE);
    });

    it('should throw NotFoundException if product is not found or inactive', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getProductById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
