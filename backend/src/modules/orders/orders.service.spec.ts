import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { UsersRepository } from '../users/users.repository';
import { OrderStateMachine } from './state-machine/order-state-machine';
import { PaymentFactoryService } from './payments/payment-factory.service';
import { FulfillmentFactoryService } from './fulfillment/fulfillment-factory.service';
import { FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus } from './enums/order.enums';
import { OrderEntity } from './entities/order.entity';
import { UserEntity } from '../users/entities/user.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepo: jest.Mocked<OrdersRepository>;
  let usersRepo: jest.Mocked<UsersRepository>;
  let stateMachine: OrderStateMachine;
  let paymentFactory: PaymentFactoryService;
  let fulfillmentFactory: FulfillmentFactoryService;
  let eventEmitter: EventEmitter2;

  const mockUser: UserEntity = {
    id: 'user-1',
    phone_number: '+919876543210',
    name: 'Kisan Ramesh',
    address: 'Plot 4, Bilhaur',
    pincode: '209202',
    district: 'Kanpur Nagar',
    region: 'Kanpur',
    created_at: new Date(),
  };

  const mockOrder: OrderEntity = {
    id: 'order-1',
    user_id: 'user-1',
    status: OrderStatus.PLACED,
    fulfillment_type: FulfillmentType.DELIVERY,
    total_amount: 1200,
    payment_status: PaymentStatus.PENDING,
    payment_method: PaymentMethod.COD,
    gst_invoice_no: 'BKM-INV-2026-123456',
    idempotency_key: 'idem-key-1',
    created_at: new Date(),
    items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'prod-1',
        product_name: 'Roundup Herbicide',
        quantity: 2,
        unit_price: 600,
        subtotal: 1200,
      },
    ],
  };

  beforeEach(async () => {
    const mockOrdersRepo = {
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByUserId: jest.fn(),
      createOrderTransaction: jest.fn(),
      cancelOrderAndRestoreStock: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockUsersRepo = {
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockPaymentProvider = {
      initiate: jest.fn().mockResolvedValue({ success: true, paymentStatus: PaymentStatus.PENDING }),
      verify: jest.fn().mockResolvedValue({ success: true, paymentStatus: PaymentStatus.COMPLETED }),
      refund: jest.fn().mockResolvedValue({ success: true }),
    };

    const mockPaymentFactory = {
      getProvider: jest.fn().mockReturnValue(mockPaymentProvider),
    };

    const mockFulfillmentStrategy = {
      calculateFee: jest.fn().mockReturnValue(0),
      validateEligibility: jest.fn(),
    };

    const mockFulfillmentFactory = {
      getStrategy: jest.fn().mockReturnValue(mockFulfillmentStrategy),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderStateMachine,
        { provide: OrdersRepository, useValue: mockOrdersRepo },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: PaymentFactoryService, useValue: mockPaymentFactory },
        { provide: FulfillmentFactoryService, useValue: mockFulfillmentFactory },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepo = module.get(OrdersRepository);
    usersRepo = module.get(UsersRepository);
    stateMachine = module.get(OrderStateMachine);
    paymentFactory = module.get(PaymentFactoryService);
    fulfillmentFactory = module.get(FulfillmentFactoryService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('createOrder', () => {
    it('should return existing order if idempotency key already processed', async () => {
      ordersRepo.findByIdempotencyKey.mockResolvedValue(mockOrder);

      const result = await service.createOrder(
        'user-1',
        {
          items: [{ productId: 'prod-1', quantity: 2 }],
          fulfillmentType: FulfillmentType.DELIVERY,
          paymentMethod: PaymentMethod.COD,
          idempotencyKey: 'idem-key-1',
        },
      );

      expect(ordersRepo.findByIdempotencyKey).toHaveBeenCalledWith('idem-key-1');
      expect(result.id).toEqual('order-1');
      expect(ordersRepo.createOrderTransaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if idempotency key belongs to another user', async () => {
      ordersRepo.findByIdempotencyKey.mockResolvedValue({
        ...mockOrder,
        user_id: 'other-user',
      });

      await expect(
        service.createOrder('user-1', {
          items: [{ productId: 'prod-1', quantity: 2 }],
          fulfillmentType: FulfillmentType.DELIVERY,
          paymentMethod: PaymentMethod.COD,
          idempotencyKey: 'idem-key-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully create order and emit order.placed event', async () => {
      ordersRepo.findByIdempotencyKey.mockResolvedValue(null);
      usersRepo.findById.mockResolvedValue(mockUser);
      ordersRepo.createOrderTransaction.mockResolvedValue(mockOrder);

      const result = await service.createOrder('user-1', {
        items: [{ productId: 'prod-1', quantity: 2 }],
        fulfillmentType: FulfillmentType.DELIVERY,
        paymentMethod: PaymentMethod.COD,
      });

      expect(usersRepo.findById).toHaveBeenCalledWith('user-1');
      expect(ordersRepo.createOrderTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.placed',
        expect.anything(),
      );
      expect(result.id).toEqual('order-1');
      expect(result.totalAmount).toEqual(1200);
    });
  });

  describe('getOrderById', () => {
    it('should return order when requested by owner', async () => {
      ordersRepo.findById.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order-1', 'user-1');
      expect(result.id).toEqual('order-1');
    });

    it('should throw NotFoundException if order does not exist', async () => {
      ordersRepo.findById.mockResolvedValue(null);

      await expect(service.getOrderById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if requested by another user', async () => {
      ordersRepo.findById.mockResolvedValue(mockOrder);

      await expect(service.getOrderById('order-1', 'intruder-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel placed order, restore stock and emit event', async () => {
      ordersRepo.findById.mockResolvedValue(mockOrder);
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      ordersRepo.cancelOrderAndRestoreStock.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder('order-1', 'user-1');

      expect(ordersRepo.cancelOrderAndRestoreStock).toHaveBeenCalledWith('order-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'order.status_changed',
        expect.anything(),
      );
      expect(result.status).toEqual(OrderStatus.CANCELLED);
    });

    it('should reject cancellation if order is already packed', async () => {
      ordersRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PACKED,
      });

      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
