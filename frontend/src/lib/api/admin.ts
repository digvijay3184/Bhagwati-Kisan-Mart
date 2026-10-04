import { apiRequest } from './client';
import { AdminUser, Order, OrderStatus, Product, ProductCategory } from './types';

export const adminApi = {
  // Orders
  async listOrders(params: { page?: number; limit?: number; status?: OrderStatus } = {}): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);

    const qs = query.toString();
    return apiRequest(`/admin/orders${qs ? `?${qs}` : ''}`, { requiresAuth: true });
  },

  async getOrder(id: string): Promise<Order> {
    return apiRequest<Order>(`/admin/orders/${id}`, { requiresAuth: true });
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiRequest<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      requiresAuth: true,
    });
  },

  // Products
  async listProducts(params: { page?: number; limit?: number; category?: ProductCategory; isActive?: boolean } = {}): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.category) query.append('category', params.category);
    if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());

    const qs = query.toString();
    return apiRequest(`/admin/products${qs ? `?${qs}` : ''}`, { requiresAuth: true });
  },

  async createProduct(dto: {
    name: string;
    category: ProductCategory;
    brand: string;
    description?: string;
    dosageInfo?: string;
    price: number;
    mrp: number;
    stockQty: number;
    hsnCode?: string;
    gstRate?: number;
    imageUrls?: string[];
  }): Promise<Product> {
    return apiRequest<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  async updateProduct(id: string, dto: Partial<Product>): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  async updateStock(id: string, stockQty: number): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQty }),
      requiresAuth: true,
    });
  },

  async deleteProduct(id: string): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },

  // Staff (Owner only)
  async listStaff(): Promise<AdminUser[]> {
    return apiRequest<AdminUser[]>('/admin/staff', { requiresAuth: true });
  },

  async createStaff(dto: { name: string; phoneNumber: string }): Promise<AdminUser> {
    return apiRequest<AdminUser>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },

  async deleteStaff(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/admin/staff/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
};
