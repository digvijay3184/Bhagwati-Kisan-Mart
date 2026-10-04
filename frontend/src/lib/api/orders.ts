import { apiRequest } from './client';
import { CreateOrderDto, Order } from './types';

export const ordersApi = {
  async createOrder(dto: CreateOrderDto, idempotencyKey?: string): Promise<Order> {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
      idempotencyKey,
    });
  },

  async getMyOrders(params: { page?: number; limit?: number } = {}): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    return apiRequest(`/orders${qs ? `?${qs}` : ''}`, { requiresAuth: true });
  },

  async getOrderById(id: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}`, { requiresAuth: true });
  },

  async cancelOrder(id: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${id}/cancel`, {
      method: 'PATCH',
      requiresAuth: true,
    });
  },
};
