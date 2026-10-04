import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPlacedEvent, OrderStatusChangedEvent } from './order-events';

@Injectable()
export class OrderEventsListener {
  private readonly logger = new Logger(OrderEventsListener.name);

  @OnEvent('order.placed')
  handleOrderPlacedEvent(event: OrderPlacedEvent) {
    this.logger.log(
      `[EVENT] Order Placed: OrderID=${event.orderId}, UserID=${event.userId}, Total=₹${event.totalAmount}, Fulfillment=${event.fulfillmentType}`,
    );
  }

  @OnEvent('order.status_changed')
  handleOrderStatusChangedEvent(event: OrderStatusChangedEvent) {
    this.logger.log(
      `[EVENT] Order Status Changed: OrderID=${event.orderId}, Transition: ${event.previousStatus} -> ${event.newStatus}`,
    );
  }
}
