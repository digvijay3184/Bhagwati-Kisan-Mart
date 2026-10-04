import { BadRequestException } from '@nestjs/common';
import { PaymentFactoryService } from './payment-factory.service';
import { CODProvider } from './cod.provider';
import { RazorpayProvider } from './razorpay.provider';
import { PayUProvider } from './payu.provider';
import { PaymentMethod, PaymentStatus } from '../enums/order.enums';

describe('Payment Strategy Pattern', () => {
  let factory: PaymentFactoryService;
  let codProvider: CODProvider;
  let razorpayProvider: RazorpayProvider;
  let payuProvider: PayUProvider;

  beforeEach(() => {
    codProvider = new CODProvider();
    razorpayProvider = new RazorpayProvider();
    payuProvider = new PayUProvider();
    factory = new PaymentFactoryService(
      codProvider,
      razorpayProvider,
      payuProvider,
    );
  });

  it('should return CODProvider for PaymentMethod.COD', async () => {
    const provider = factory.getProvider(PaymentMethod.COD);
    expect(provider).toBe(codProvider);

    const initResult = await provider.initiate('ord-1', 500);
    expect(initResult.success).toBe(true);
    expect(initResult.paymentStatus).toBe(PaymentStatus.PENDING);

    const verifyResult = await provider.verify('ord-1');
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.paymentStatus).toBe(PaymentStatus.COMPLETED);

    const refundResult = await provider.refund('ord-1', 500);
    expect(refundResult.success).toBe(true);
  });

  it('should return RazorpayProvider for PaymentMethod.ONLINE and throw KYC deferral error', async () => {
    const provider = factory.getProvider(PaymentMethod.ONLINE);
    expect(provider).toBe(razorpayProvider);

    await expect(provider.initiate('ord-1', 500)).rejects.toThrow(
      BadRequestException,
    );
  });
});
