import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersRepository } from './orders.repository';
import { UsersRepository } from '../users/users.repository';
import { OrderStateMachine } from './state-machine/order-state-machine';
import { PaymentFactoryService } from './payments/payment-factory.service';
import { FulfillmentFactoryService } from './fulfillment/fulfillment-factory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from './dto/order-response.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderStatus } from './enums/order.enums';
import { OrderPlacedEvent, OrderStatusChangedEvent } from './events/order-events';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly stateMachine: OrderStateMachine,
    private readonly paymentFactory: PaymentFactoryService,
    private readonly fulfillmentFactory: FulfillmentFactoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
    headerIdempotencyKey?: string,
  ): Promise<OrderResponseDto> {
    const idempotencyKey = dto.idempotencyKey || headerIdempotencyKey;

    // 1. Check idempotency upfront
    if (idempotencyKey) {
      const existingOrder =
        await this.ordersRepository.findByIdempotencyKey(idempotencyKey);
      if (existingOrder) {
        if (existingOrder.user_id !== userId) {
          throw new ForbiddenException('Idempotency key belongs to another user');
        }
        this.logger.log(
          `Idempotent order request detected. Returning existing order ${existingOrder.id}`,
        );
        return OrderResponseDto.fromEntity(existingOrder);
      }
    }

    // 2. Fetch and validate customer profile
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Customer account not found`);
    }

    // 3. Validate fulfillment eligibility (address, 6-digit pincode)
    const fulfillmentStrategy = this.fulfillmentFactory.getStrategy(
      dto.fulfillmentType,
    );
    fulfillmentStrategy.validateEligibility(user.address, user.pincode);

    // 4. Verify payment provider
    const paymentProvider = this.paymentFactory.getProvider(dto.paymentMethod);

    // 5. Generate GST compliant invoice sequence identifier
    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const gstInvoiceNo = `BKM-INV-${currentYear}-${randomSeq}`;

    // 6. Execute atomic stock decrement & order creation transaction
    const order = await this.ordersRepository.createOrderTransaction({
      userId,
      items: dto.items,
      fulfillmentType: dto.fulfillmentType,
      paymentMethod: dto.paymentMethod,
      calculateDeliveryFee: (subtotal: number) =>
        fulfillmentStrategy.calculateFee(subtotal, user.pincode),
      gstInvoiceNo,
      idempotencyKey,
    });

    // 7. Initiate payment with the chosen strategy
    await paymentProvider.initiate(order.id, order.total_amount);

    // 8. Decoupled side effects via event emitter
    this.eventEmitter.emit(
      'order.placed',
      new OrderPlacedEvent(
        order.id,
        userId,
        order.total_amount,
        order.fulfillment_type,
        order.payment_method,
      ),
    );

    return OrderResponseDto.fromEntity(order);
  }

  async getOrderById(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }

    return OrderResponseDto.fromEntity(order);
  }

  async listOrders(
    userId: string,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    const { items, total } = await this.ordersRepository.findByUserId(userId, {
      page,
      limit,
      status: query.status,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((order) => OrderResponseDto.fromEntity(order)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    reason?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this order',
      );
    }

    // Validate with state machine
    if (!this.stateMachine.canCustomerCancel(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled because it is in "${order.status}" status`,
      );
    }

    // Restores stock and updates status in a database transaction
    const cancelledOrder =
      await this.ordersRepository.cancelOrderAndRestoreStock(orderId);

    // Trigger payment refund / reversal via strategy
    const paymentProvider = this.paymentFactory.getProvider(order.payment_method);
    await paymentProvider.refund(orderId, order.total_amount);

    // Emit event
    this.eventEmitter.emit(
      'order.status_changed',
      new OrderStatusChangedEvent(
        orderId,
        userId,
        order.status,
        OrderStatus.CANCELLED,
      ),
    );

    return OrderResponseDto.fromEntity(cancelledOrder);
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    // Validate state machine rules
    this.stateMachine.validateTransition(
      order.status,
      newStatus,
      order.fulfillment_type,
    );

    let updatedOrder: any;

    if (newStatus === OrderStatus.CANCELLED) {
      updatedOrder =
        await this.ordersRepository.cancelOrderAndRestoreStock(orderId);
    } else {
      updatedOrder = await this.ordersRepository.updateStatus(
        orderId,
        newStatus,
      );
    }

    this.eventEmitter.emit(
      'order.status_changed',
      new OrderStatusChangedEvent(
        orderId,
        order.user_id,
        order.status,
        newStatus,
      ),
    );

    return OrderResponseDto.fromEntity(updatedOrder!);
  }
}
