export interface FulfillmentValidationResult {
  valid: boolean;
  message?: string;
}

export interface FulfillmentStrategy {
  calculateFee(orderSubtotal: number, pincode?: string | null): number;
  validateEligibility(address?: string | null, pincode?: string | null): void;
}
