import { apiRequest } from './client';
import { Product, ProductsResponse, ProductCategory } from './types';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: ProductCategory;
  search?: string;
}

export const productsApi = {
  async getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const qs = query.toString();
    const endpoint = `/products${qs ? `?${qs}` : ''}`;
    return apiRequest<ProductsResponse>(endpoint, { requiresAuth: false });
  },

  async getProductById(id: string): Promise<Product> {
    return apiRequest<Product>(`/products/${id}`, { requiresAuth: false });
  },
};
