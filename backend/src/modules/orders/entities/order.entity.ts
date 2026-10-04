import { FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus } from '../enums/order.enums';
import { OrderItemEntity } from './order-item.entity';

export class OrderEntity {
  id: string;
  user_id: string;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  gst_invoice_no: string | null;
  idempotency_key: string | null;
  created_at: Date;
  items?: OrderItemEntity[];
}
