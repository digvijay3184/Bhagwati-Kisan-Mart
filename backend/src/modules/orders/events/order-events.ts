import { FulfillmentType, OrderStatus, PaymentMethod } from '../enums/order.enums';

export class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly fulfillmentType: FulfillmentType,
    public readonly paymentMethod: PaymentMethod,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
  ) {}
}
