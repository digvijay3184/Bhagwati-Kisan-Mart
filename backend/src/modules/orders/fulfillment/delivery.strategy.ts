import { BadRequestException, Injectable } from '@nestjs/common';
import { FulfillmentStrategy } from './fulfillment-strategy.interface';

@Injectable()
export class DeliveryStrategy implements FulfillmentStrategy {
  /**
   * Free delivery for orders >= ₹1000. Flat ₹50 delivery fee below ₹1000.
   */
  calculateFee(orderSubtotal: number, pincode?: string | null): number {
    if (orderSubtotal >= 1000) {
      return 0;
    }
    return 50;
  }

  /**
   * Home delivery requires a complete address and 6-digit postal code.
   */
  validateEligibility(address?: string | null, pincode?: string | null): void {
    if (!address || address.trim().length < 5) {
      throw new BadRequestException(
        'Delivery orders require a complete delivery address. Please update your profile before checkout.',
      );
    }

    if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      throw new BadRequestException(
        'Delivery orders require a valid 6-digit Indian PIN code. Please update your profile before checkout.',
      );
    }
  }
}
