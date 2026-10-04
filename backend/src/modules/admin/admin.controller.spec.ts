import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProductCategory } from '../products/dto/product-category.enum';
import { OrderStatus } from '../orders/enums/order.enums';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  beforeEach(async () => {
    const mockService = {
      listStaff: jest.fn(),
      createStaff: jest.fn(),
      deleteStaff: jest.fn(),
      listProducts: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      updateStock: jest.fn(),
      deleteProduct: jest.fn(),
      listOrders: jest.fn(),
      getOrder: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get(AdminService);
  });

  it('createProduct - calls adminService.createProduct', async () => {
    const dto = {
      name: 'Urea',
      category: ProductCategory.FERTILIZER,
      brand: 'IFFCO',
      price: 266.5,
      mrp: 266.5,
      stockQty: 100,
    };
    service.createProduct.mockResolvedValue({ id: 'p1', ...dto });

    const result = await controller.createProduct(dto);
    expect(service.createProduct).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('p1');
  });

  it('updateStock - calls adminService.updateStock', async () => {
    service.updateStock.mockResolvedValue({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', stock_qty: 50 });

    const result = await controller.updateStock('f47ac10b-58cc-4372-a567-0e02b2c3d479', { stockQty: 50 });
    expect(service.updateStock).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479', 50);
    expect(result.stock_qty).toBe(50);
  });

  it('updateOrderStatus - calls adminService.updateOrderStatus', async () => {
    service.updateOrderStatus.mockResolvedValue({ id: 'b6e3f524-77f2-4cf3-9467-3ce942d45a70', status: OrderStatus.CONFIRMED } as any);

    const result = await controller.updateOrderStatus('b6e3f524-77f2-4cf3-9467-3ce942d45a70', { status: OrderStatus.CONFIRMED });
    expect(service.updateOrderStatus).toHaveBeenCalledWith('b6e3f524-77f2-4cf3-9467-3ce942d45a70', OrderStatus.CONFIRMED);
    expect(result.status).toBe(OrderStatus.CONFIRMED);
  });

  it('createStaff - calls adminService.createStaff', async () => {
    const dto = { name: 'Mohan Lal', phoneNumber: '9876543210' };
    service.createStaff.mockResolvedValue({
      id: 's1',
      name: 'Mohan Lal',
      phone_number: '+919876543210',
      role: 'staff',
      created_at: new Date(),
    });

    const result = await controller.createStaff(dto);
    expect(service.createStaff).toHaveBeenCalledWith(dto);
    expect(result.name).toBe('Mohan Lal');
  });
});
