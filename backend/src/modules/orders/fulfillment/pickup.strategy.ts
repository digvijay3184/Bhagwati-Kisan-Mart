import { Injectable } from '@nestjs/common';
import { FulfillmentStrategy } from './fulfillment-strategy.interface';

@Injectable()
export class PickupStrategy implements FulfillmentStrategy {
  /**
   * In-store pickup has zero fulfillment fee.
   */
  calculateFee(orderSubtotal: number, pincode?: string | null): number {
    return 0;
  }

  /**
   * Pickup orders do not require residential delivery address or pincode.
   */
  validateEligibility(address?: string | null, pincode?: string | null): void {
    // Pickup is always eligible
  }
}
