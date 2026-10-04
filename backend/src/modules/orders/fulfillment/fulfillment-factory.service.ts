import { BadRequestException, Injectable } from '@nestjs/common';
import { FulfillmentType } from '../enums/order.enums';
import { FulfillmentStrategy } from './fulfillment-strategy.interface';
import { DeliveryStrategy } from './delivery.strategy';
import { PickupStrategy } from './pickup.strategy';

@Injectable()
export class FulfillmentFactoryService {
  constructor(
    private readonly deliveryStrategy: DeliveryStrategy,
    private readonly pickupStrategy: PickupStrategy,
  ) {}

  getStrategy(type: FulfillmentType): FulfillmentStrategy {
    switch (type) {
      case FulfillmentType.DELIVERY:
        return this.deliveryStrategy;
      case FulfillmentType.PICKUP:
        return this.pickupStrategy;
      default:
        throw new BadRequestException(`Unsupported fulfillment type: ${type}`);
    }
  }
}
