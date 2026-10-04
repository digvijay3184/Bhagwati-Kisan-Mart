import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { OrdersService } from '../orders/orders.service';
import { ProductCategory } from '../products/dto/product-category.enum';
import { OrderStatus } from '../orders/enums/order.enums';

describe('AdminService', () => {
  let service: AdminService;
  let adminRepo: jest.Mocked<AdminRepository>;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    const mockAdminRepo = {
      findAllStaff: jest.fn(),
      findAdminByPhoneNumber: jest.fn(),
      createAdminUser: jest.fn(),
      deleteAdminUser: jest.fn(),
      findAllProducts: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      updateStock: jest.fn(),
      softDeleteProduct: jest.fn(),
      findAllOrders: jest.fn(),
      findOrderById: jest.fn(),
    };

    const mockOrdersService = {
      updateOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: AdminRepository, useValue: mockAdminRepo },
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    adminRepo = module.get(AdminRepository);
    ordersService = module.get(OrdersService);
  });

  describe('Staff Management', () => {
    it('createStaff - should create staff user when phone number is unique', async () => {
      adminRepo.findAdminByPhoneNumber.mockResolvedValue(null);
      adminRepo.createAdminUser.mockResolvedValue({
        id: 'adm-1',
        name: 'Suresh Kumar',
        phone_number: '+919876543211',
        role: 'staff',
        created_at: new Date(),
      });

      const result = await service.createStaff({
        name: 'Suresh Kumar',
        phoneNumber: '9876543211',
        role: 'staff',
      });

      expect(adminRepo.createAdminUser).toHaveBeenCalledWith(
        'Suresh Kumar',
        '+919876543211',
        'staff',
      );
      expect(result.id).toEqual('adm-1');
    });

    it('createStaff - should throw ConflictException if phone number already exists', async () => {
      adminRepo.findAdminByPhoneNumber.mockResolvedValue({
        id: 'adm-1',
        name: 'Suresh Kumar',
        phone_number: '+919876543211',
        role: 'staff',
        created_at: new Date(),
      });

      await expect(
        service.createStaff({
          name: 'Suresh Kumar',
          phoneNumber: '+919876543211',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deleteStaff - should throw NotFoundException if user not found', async () => {
      adminRepo.deleteAdminUser.mockResolvedValue(false);

      await expect(service.deleteStaff('adm-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Product Management', () => {
    it('createProduct - should reject if MRP < price', async () => {
      await expect(
        service.createProduct({
          name: 'Roundup',
          category: ProductCategory.HERBICIDE,
          brand: 'Bayer',
          price: 600,
          mrp: 500, // Invalid!
          stockQty: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('createProduct - should create product when data is valid', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Roundup',
        category: ProductCategory.HERBICIDE,
        brand: 'Bayer',
        price: 600,
        mrp: 650,
        stock_qty: 10,
      };
      adminRepo.createProduct.mockResolvedValue(mockProduct);

      const result = await service.createProduct({
        name: 'Roundup',
        category: ProductCategory.HERBICIDE,
        brand: 'Bayer',
        price: 600,
        mrp: 650,
        stockQty: 10,
      });

      expect(result).toEqual(mockProduct);
    });

    it('updateStock - should update stock quantity', async () => {
      adminRepo.updateStock.mockResolvedValue({ id: 'prod-1', stock_qty: 25 });

      const result = await service.updateStock('prod-1', 25);
      expect(result.stock_qty).toBe(25);
    });

    it('deleteProduct - should perform soft delete', async () => {
      adminRepo.softDeleteProduct.mockResolvedValue({ id: 'prod-1', is_active: false });

      const result = await service.deleteProduct('prod-1');
      expect(result.message).toContain('Product deactivated successfully');
    });
  });

  describe('Order Management', () => {
    it('updateOrderStatus - delegates to ordersService.updateOrderStatus', async () => {
      const mockOrder: any = { id: 'ord-1', status: OrderStatus.CONFIRMED };
      ordersService.updateOrderStatus.mockResolvedValue(mockOrder);

      const result = await service.updateOrderStatus('ord-1', OrderStatus.CONFIRMED);
      expect(ordersService.updateOrderStatus).toHaveBeenCalledWith('ord-1', OrderStatus.CONFIRMED);
      expect(result).toEqual(mockOrder);
    });
  });
});
