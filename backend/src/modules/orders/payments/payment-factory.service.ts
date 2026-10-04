import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod } from '../enums/order.enums';
import { PaymentProvider } from './payment-provider.interface';
import { CODProvider } from './cod.provider';
import { RazorpayProvider } from './razorpay.provider';
import { PayUProvider } from './payu.provider';

@Injectable()
export class PaymentFactoryService {
  constructor(
    private readonly codProvider: CODProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly payuProvider: PayUProvider,
  ) {}

  getProvider(method: PaymentMethod): PaymentProvider {
    switch (method) {
      case PaymentMethod.COD:
        return this.codProvider;
      case PaymentMethod.ONLINE:
        // By default, Razorpay is the primary online provider
        return this.razorpayProvider;
      default:
        throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
  }
}
