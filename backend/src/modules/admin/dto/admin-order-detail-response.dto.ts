import { FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/enums/order.enums';
import { OrderItemResponseDto } from '../../orders/dto/order-response.dto';

export class CustomerDetailDto {
  id: string;
  phoneNumber: string;
  name: string | null;
  address: string | null;
  pincode: string | null;
  district: string | null;
  region: string | null;
}

export class AdminOrderDetailResponseDto {
  id: string;
  customer: CustomerDetailDto;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  gstInvoiceNo: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  items: OrderItemResponseDto[];
}
