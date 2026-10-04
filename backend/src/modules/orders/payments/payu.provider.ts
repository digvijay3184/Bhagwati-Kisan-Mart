import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  PaymentInitiationResult,
  PaymentProvider,
  PaymentRefundResult,
  PaymentVerificationResult,
} from './payment-provider.interface';

@Injectable()
export class PayUProvider implements PaymentProvider {
  private readonly logger = new Logger(PayUProvider.name);

  async initiate(orderId: string, amount: number): Promise<PaymentInitiationResult> {
    this.logger.warn(`PayU payment initiated for order ${orderId}, but online gateway is deferred pending merchant KYC.`);
    throw new BadRequestException(
      'Online payment via PayU is currently deferred pending merchant KYC verification. Please select Cash on Delivery (COD).',
    );
  }

  async verify(orderId: string, payload?: any): Promise<PaymentVerificationResult> {
    throw new BadRequestException('PayU verification is inactive in Phase 1.');
  }

  async refund(orderId: string, amount: number): Promise<PaymentRefundResult> {
    throw new BadRequestException('PayU refund is inactive in Phase 1.');
  }
}
