import { FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus } from '../enums/order.enums';
import { OrderEntity } from '../entities/order.entity';

export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderResponseDto {
  id: string;
  userId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  gstInvoiceNo: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  items: OrderItemResponseDto[];

  static fromEntity(entity: OrderEntity): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = entity.id;
    dto.userId = entity.user_id;
    dto.status = entity.status;
    dto.fulfillmentType = entity.fulfillment_type;
    dto.totalAmount = Number(entity.total_amount);
    dto.paymentStatus = entity.payment_status;
    dto.paymentMethod = entity.payment_method;
    dto.gstInvoiceNo = entity.gst_invoice_no;
    dto.idempotencyKey = entity.idempotency_key;
    dto.createdAt = entity.created_at
      ? new Date(entity.created_at).toISOString()
      : new Date().toISOString();
    dto.items = (entity.items || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    }));
    return dto;
  }
}

export class PaginatedOrdersResponseDto {
  items: OrderResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
