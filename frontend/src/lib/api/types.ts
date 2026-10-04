export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: {
    message: string;
    code: string;
    details?: any;
  } | null;
}

export type ProductCategory =
  | 'insecticide'
  | 'herbicide'
  | 'fungicide'
  | 'fertilizer'
  | 'seed'
  | 'growth_promoter'
  | 'farm_tool'
  | 'cattle_feed';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description: string | null;
  dosageInfo: string | null;
  price: number;
  mrp: number;
  stockQty: number;
  inStock: boolean;
  hsnCode: string | null;
  gstRate: number;
  imageUrls: string[];
  createdAt: string;
}

export interface ProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsResponse {
  items: Product[];
  meta: ProductsMeta;
}

export type UserRole = 'customer' | 'owner' | 'staff';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string | null;
  address: string | null;
  pincode: string | null;
  district: string | null;
  region: string | null;
  isProfileComplete: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: {
    id: string;
    phoneNumber: string;
    name: string | null;
    role: UserRole;
    isProfileComplete: boolean;
  };
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'delivered'
  | 'picked_up'
  | 'cancelled';

export type FulfillmentType = 'delivery' | 'pickup';
export type PaymentMethod = 'cod';
export type PaymentStatus = 'pending' | 'collected' | 'refunded';

export interface OrderItem {
  id: string;
  order_id?: string;
  orderId?: string;
  product_id?: string;
  productId?: string;
  product_name?: string;
  productName?: string;
  quantity: number;
  unit_price?: number;
  unitPrice?: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id?: string;
  userId?: string;
  status: OrderStatus;
  fulfillment_type?: FulfillmentType;
  fulfillmentType?: FulfillmentType;
  total_amount?: number;
  totalAmount?: number;
  payment_status?: PaymentStatus;
  paymentStatus?: PaymentStatus;
  payment_method?: PaymentMethod;
  paymentMethod?: PaymentMethod;
  gst_invoice_no?: string | null;
  gstInvoiceNo?: string | null;
  idempotency_key?: string | null;
  idempotencyKey?: string | null;
  created_at?: string;
  createdAt?: string;
  items: OrderItem[];
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface DeliveryAddressDto {
  village: string;
  landmark?: string;
  pincode: string;
  district: string;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  fulfillmentType: FulfillmentType;
  deliveryAddress?: DeliveryAddressDto;
  paymentMethod: 'cod';
}

export interface AdminUser {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'owner' | 'staff';
  createdAt: string;
}
