import { BadRequestException } from '@nestjs/common';
import { OrderStateMachine } from './order-state-machine';
import { FulfillmentType, OrderStatus } from '../enums/order.enums';

describe('OrderStateMachine', () => {
  let stateMachine: OrderStateMachine;

  beforeEach(() => {
    stateMachine = new OrderStateMachine();
  });

  describe('validateTransition', () => {
    it('should permit valid transition from placed to confirmed', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.PLACED,
          OrderStatus.CONFIRMED,
          FulfillmentType.DELIVERY,
        ),
      ).not.toThrow();
    });

    it('should permit valid transition from placed to cancelled', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.PLACED,
          OrderStatus.CANCELLED,
          FulfillmentType.DELIVERY,
        ),
      ).not.toThrow();
    });

    it('should permit delivery path: packed -> out_for_delivery', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.PACKED,
          OrderStatus.OUT_FOR_DELIVERY,
          FulfillmentType.DELIVERY,
        ),
      ).not.toThrow();
    });

    it('should permit pickup path: packed -> ready_for_pickup', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.PACKED,
          OrderStatus.READY_FOR_PICKUP,
          FulfillmentType.PICKUP,
        ),
      ).not.toThrow();
    });

    it('should reject pickup status for a delivery order', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.PACKED,
          OrderStatus.READY_FOR_PICKUP,
          FulfillmentType.DELIVERY,
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject invalid direct jump: placed -> delivered', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.PLACED,
          OrderStatus.DELIVERED,
          FulfillmentType.DELIVERY,
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject transition from terminal state delivered', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
          FulfillmentType.DELIVERY,
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject transition from terminal state cancelled', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.CANCELLED,
          OrderStatus.PLACED,
          FulfillmentType.DELIVERY,
        ),
      ).toThrow(BadRequestException);
    });

    it('should allow same-status no-op transition', () => {
      expect(() =>
        stateMachine.validateTransition(
          OrderStatus.CONFIRMED,
          OrderStatus.CONFIRMED,
          FulfillmentType.DELIVERY,
        ),
      ).not.toThrow();
    });
  });

  describe('canCustomerCancel', () => {
    it('should allow customer cancellation in placed state', () => {
      expect(stateMachine.canCustomerCancel(OrderStatus.PLACED)).toBe(true);
    });

    it('should allow customer cancellation in confirmed state', () => {
      expect(stateMachine.canCustomerCancel(OrderStatus.CONFIRMED)).toBe(true);
    });

    it('should disallow customer cancellation in packed, out_for_delivery, delivered, cancelled states', () => {
      expect(stateMachine.canCustomerCancel(OrderStatus.PACKED)).toBe(false);
      expect(stateMachine.canCustomerCancel(OrderStatus.OUT_FOR_DELIVERY)).toBe(
        false,
      );
      expect(stateMachine.canCustomerCancel(OrderStatus.READY_FOR_PICKUP)).toBe(
        false,
      );
      expect(stateMachine.canCustomerCancel(OrderStatus.DELIVERED)).toBe(false);
      expect(stateMachine.canCustomerCancel(OrderStatus.PICKED_UP)).toBe(false);
      expect(stateMachine.canCustomerCancel(OrderStatus.CANCELLED)).toBe(false);
    });
  });
});
