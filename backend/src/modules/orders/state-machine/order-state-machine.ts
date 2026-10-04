import { BadRequestException, Injectable } from '@nestjs/common';
import { FulfillmentType, OrderStatus } from '../enums/order.enums';

@Injectable()
export class OrderStateMachine {
  /**
   * Returns valid next states given the current status and fulfillment type.
   */
  getNextValidStates(
    currentStatus: OrderStatus,
    fulfillmentType: FulfillmentType,
  ): OrderStatus[] {
    switch (currentStatus) {
      case OrderStatus.PLACED:
        return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];

      case OrderStatus.CONFIRMED:
        return [OrderStatus.PACKED, OrderStatus.CANCELLED];

      case OrderStatus.PACKED:
        if (fulfillmentType === FulfillmentType.DELIVERY) {
          return [OrderStatus.OUT_FOR_DELIVERY];
        }
        return [OrderStatus.READY_FOR_PICKUP];

      case OrderStatus.OUT_FOR_DELIVERY:
        return [OrderStatus.DELIVERED];

      case OrderStatus.READY_FOR_PICKUP:
        return [OrderStatus.PICKED_UP];

      case OrderStatus.DELIVERED:
      case OrderStatus.PICKED_UP:
      case OrderStatus.CANCELLED:
      default:
        return []; // Terminal states
    }
  }

  /**
   * Validates whether transition from current to next status is permitted.
   * Throws BadRequestException if the transition is illegal.
   */
  validateTransition(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
    fulfillmentType: FulfillmentType,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const validStates = this.getNextValidStates(currentStatus, fulfillmentType);

    if (!validStates.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from "${currentStatus}" to "${nextStatus}" for fulfillment type "${fulfillmentType}". Permitted transitions: [${validStates.join(', ')}]`,
      );
    }
  }

  /**
   * Checks if an order can be cancelled by the customer.
   * Customers may cancel in 'placed' or 'confirmed' states.
   */
  canCustomerCancel(currentStatus: OrderStatus): boolean {
    return (
      currentStatus === OrderStatus.PLACED ||
      currentStatus === OrderStatus.CONFIRMED
    );
  }
}
