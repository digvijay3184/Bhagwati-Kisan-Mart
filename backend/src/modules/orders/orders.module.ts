import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderStateMachine } from './state-machine/order-state-machine';
import { PaymentFactoryService } from './payments/payment-factory.service';
import { CODProvider } from './payments/cod.provider';
import { RazorpayProvider } from './payments/razorpay.provider';
import { PayUProvider } from './payments/payu.provider';
import { FulfillmentFactoryService } from './fulfillment/fulfillment-factory.service';
import { DeliveryStrategy } from './fulfillment/delivery.strategy';
import { PickupStrategy } from './fulfillment/pickup.strategy';
import { OrderEventsListener } from './events/order-events.listener';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderStateMachine,
    PaymentFactoryService,
    CODProvider,
    RazorpayProvider,
    PayUProvider,
    FulfillmentFactoryService,
    DeliveryStrategy,
    PickupStrategy,
    OrderEventsListener,
  ],
  exports: [OrdersService, OrdersRepository, OrderStateMachine],
})
export class OrdersModule {}
