import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AppConfigModule,
    DatabaseModule,
    ProductsModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
