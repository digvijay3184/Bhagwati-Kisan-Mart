import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCategory } from './dto/product-category.enum';

describe('ProductsController (PRD Section 2.4)', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const mockService = {
      getProducts: jest.fn(),
      getProductById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('should delegate getProducts to ProductsService', async () => {
    const expected = {
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    service.getProducts.mockResolvedValue(expected as any);

    const query = { page: 1, limit: 20, offset: 0, category: ProductCategory.HERBICIDE };
    const result = await controller.getProducts(query);

    expect(service.getProducts).toHaveBeenCalledWith(query);
    expect(result).toBe(expected);
  });

  it('should delegate getProductById to ProductsService', async () => {
    const expected = { id: 'p123', name: 'Weedicide' };
    service.getProductById.mockResolvedValue(expected as any);

    const result = await controller.getProductById('p123');

    expect(service.getProductById).toHaveBeenCalledWith('p123');
    expect(result).toBe(expected);
  });
});
