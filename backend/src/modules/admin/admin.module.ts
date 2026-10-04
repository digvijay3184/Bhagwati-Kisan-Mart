import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OrdersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository, RolesGuard],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}
