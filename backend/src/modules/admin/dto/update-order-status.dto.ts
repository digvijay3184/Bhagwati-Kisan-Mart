import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../orders/enums/order.enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'status must be one of: placed, confirmed, packed, out_for_delivery, ready_for_pickup, delivered, picked_up, cancelled',
  })
  status: OrderStatus;
}
