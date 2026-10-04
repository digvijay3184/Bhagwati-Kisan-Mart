import { PaymentStatus } from '../enums/order.enums';

export interface PaymentInitiationResult {
  success: boolean;
  transactionId: string;
  paymentStatus: PaymentStatus;
  message?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  paymentStatus: PaymentStatus;
  message?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId?: string;
  message?: string;
}

export interface PaymentProvider {
  initiate(orderId: string, amount: number): Promise<PaymentInitiationResult>;
  verify(orderId: string, payload?: any): Promise<PaymentVerificationResult>;
  refund(orderId: string, amount: number): Promise<PaymentRefundResult>;
}
