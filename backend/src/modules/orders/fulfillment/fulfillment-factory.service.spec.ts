import { BadRequestException } from '@nestjs/common';
import { FulfillmentFactoryService } from './fulfillment-factory.service';
import { DeliveryStrategy } from './delivery.strategy';
import { PickupStrategy } from './pickup.strategy';
import { FulfillmentType } from '../enums/order.enums';

describe('Fulfillment Strategy Pattern', () => {
  let factory: FulfillmentFactoryService;
  let deliveryStrategy: DeliveryStrategy;
  let pickupStrategy: PickupStrategy;

  beforeEach(() => {
    deliveryStrategy = new DeliveryStrategy();
    pickupStrategy = new PickupStrategy();
    factory = new FulfillmentFactoryService(deliveryStrategy, pickupStrategy);
  });

  describe('DeliveryStrategy', () => {
    it('should calculate ₹50 delivery fee for subtotal < ₹1000', () => {
      const fee = deliveryStrategy.calculateFee(999, '209202');
      expect(fee).toBe(50);
    });

    it('should calculate ₹0 (free delivery) for subtotal >= ₹1000', () => {
      const fee = deliveryStrategy.calculateFee(1000, '209202');
      expect(fee).toBe(0);
    });

    it('should validate eligibility when complete address and 6-digit pincode are present', () => {
      expect(() =>
        deliveryStrategy.validateEligibility(
          'Village Bilhaur, Kanpur',
          '209202',
        ),
      ).not.toThrow();
    });

    it('should throw BadRequestException if address is missing or short', () => {
      expect(() =>
        deliveryStrategy.validateEligibility('', '209202'),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if pincode is invalid', () => {
      expect(() =>
        deliveryStrategy.validateEligibility(
          'Village Bilhaur, Kanpur',
          '012345',
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('PickupStrategy', () => {
    it('should have ₹0 fulfillment fee', () => {
      expect(pickupStrategy.calculateFee(500, null)).toBe(0);
    });

    it('should not require address or pincode', () => {
      expect(() =>
        pickupStrategy.validateEligibility(null, null),
      ).not.toThrow();
    });
  });

  describe('FulfillmentFactoryService', () => {
    it('should resolve delivery strategy for DELIVERY type', () => {
      expect(factory.getStrategy(FulfillmentType.DELIVERY)).toBe(
        deliveryStrategy,
      );
    });

    it('should resolve pickup strategy for PICKUP type', () => {
      expect(factory.getStrategy(FulfillmentType.PICKUP)).toBe(pickupStrategy);
    });
  });
});
