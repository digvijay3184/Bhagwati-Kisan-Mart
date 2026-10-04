import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  PaymentInitiationResult,
  PaymentProvider,
  PaymentRefundResult,
  PaymentVerificationResult,
} from './payment-provider.interface';

@Injectable()
export class RazorpayProvider implements PaymentProvider {
  private readonly logger = new Logger(RazorpayProvider.name);

  async initiate(orderId: string, amount: number): Promise<PaymentInitiationResult> {
    this.logger.warn(`Razorpay payment initiated for order ${orderId}, but online gateway is deferred pending merchant KYC.`);
    throw new BadRequestException(
      'Online payment via Razorpay is currently deferred pending merchant KYC verification. Please select Cash on Delivery (COD).',
    );
  }

  async verify(orderId: string, payload?: any): Promise<PaymentVerificationResult> {
    throw new BadRequestException('Razorpay verification is inactive in Phase 1.');
  }

  async refund(orderId: string, amount: number): Promise<PaymentRefundResult> {
    throw new BadRequestException('Razorpay refund is inactive in Phase 1.');
  }
}
