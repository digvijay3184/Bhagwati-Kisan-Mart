import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus } from './enums/order.enums';
import { OrderResponseDto } from './dto/order-response.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: jest.Mocked<OrdersService>;

  const mockOrderResponse: OrderResponseDto = {
    id: 'b6e3f524-77f2-4cf3-9467-3ce942d45a70',
    userId: 'user-uuid-1',
    status: OrderStatus.PLACED,
    fulfillmentType: FulfillmentType.DELIVERY,
    totalAmount: 1250,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.COD,
    gstInvoiceNo: 'BKM-INV-2026-112233',
    idempotencyKey: 'idem-uuid-1234',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        productName: 'Roundup Herbicide',
        quantity: 2,
        unitPrice: 600,
        subtotal: 1200,
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      createOrder: jest.fn(),
      getOrderById: jest.fn(),
      listOrders: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get(OrdersService);
  });

  it('createOrder - calls ordersService.createOrder and returns order', async () => {
    service.createOrder.mockResolvedValue(mockOrderResponse);

    const dto: CreateOrderDto = {
      items: [{ productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', quantity: 2 }],
      fulfillmentType: FulfillmentType.DELIVERY,
      paymentMethod: PaymentMethod.COD,
    };

    const result = await controller.createOrder('user-uuid-1', dto, 'header-key');
    expect(service.createOrder).toHaveBeenCalledWith('user-uuid-1', dto, 'header-key');
    expect(result).toEqual(mockOrderResponse);
  });

  it('getOrder - calls ordersService.getOrderById', async () => {
    service.getOrderById.mockResolvedValue(mockOrderResponse);

    const result = await controller.getOrder('user-uuid-1', 'b6e3f524-77f2-4cf3-9467-3ce942d45a70');
    expect(service.getOrderById).toHaveBeenCalledWith('b6e3f524-77f2-4cf3-9467-3ce942d45a70', 'user-uuid-1');
    expect(result).toEqual(mockOrderResponse);
  });

  it('cancelOrder - calls ordersService.cancelOrder', async () => {
    const cancelled = { ...mockOrderResponse, status: OrderStatus.CANCELLED };
    service.cancelOrder.mockResolvedValue(cancelled);

    const result = await controller.cancelOrder('user-uuid-1', 'b6e3f524-77f2-4cf3-9467-3ce942d45a70', { reason: 'Wrong address' });
    expect(service.cancelOrder).toHaveBeenCalledWith('b6e3f524-77f2-4cf3-9467-3ce942d45a70', 'user-uuid-1', 'Wrong address');
    expect(result.status).toEqual(OrderStatus.CANCELLED);
  });
});
