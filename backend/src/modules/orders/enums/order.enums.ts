export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  PACKED = 'packed',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DELIVERED = 'delivered',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled',
}

export enum FulfillmentType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

export enum PaymentMethod {
  COD = 'cod',
  ONLINE = 'online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
