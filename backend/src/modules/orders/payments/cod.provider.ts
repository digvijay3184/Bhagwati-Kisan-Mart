import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentInitiationResult,
  PaymentProvider,
  PaymentRefundResult,
  PaymentVerificationResult,
} from './payment-provider.interface';
import { PaymentStatus } from '../enums/order.enums';

@Injectable()
export class CODProvider implements PaymentProvider {
  private readonly logger = new Logger(CODProvider.name);

  async initiate(orderId: string, amount: number): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating COD payment for order ${orderId}, amount: ₹${amount}`);
    return {
      success: true,
      transactionId: `COD-${orderId}`,
      paymentStatus: PaymentStatus.PENDING,
      message: 'Cash on Delivery selected. Payment will be collected upon delivery.',
    };
  }

  async verify(orderId: string, payload?: any): Promise<PaymentVerificationResult> {
    this.logger.log(`Verifying COD payment for order ${orderId}`);
    return {
      success: true,
      paymentStatus: PaymentStatus.COMPLETED,
      message: 'Cash payment confirmed by delivery/pickup agent.',
    };
  }

  async refund(orderId: string, amount: number): Promise<PaymentRefundResult> {
    this.logger.log(`Processing COD refund/reversal for order ${orderId}, amount: ₹${amount}`);
    return {
      success: true,
      refundId: `REFUND-COD-${orderId}`,
      message: 'Order cancelled before cash collection. No cash reversal required.',
    };
  }
}
