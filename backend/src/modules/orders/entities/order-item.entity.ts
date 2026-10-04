export class OrderItemEntity {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
  product_image?: string;
}
