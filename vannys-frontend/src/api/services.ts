// src/api/services.ts
import { http } from './client';
import type {
  AuthResponse, LoginPayload, RegisterPayload, User,
  Product, PaginatedResponse, ProductFilters, Category,
  Order, CreateOrderPayload,
} from '@/types';

// ── Auth ─────────────────────────────────────────────────────
export const authService = {
  login(payload: LoginPayload): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/login', payload);
  },
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/register', payload);
  },
  logout(): Promise<void> {
    return http.post<void>('/auth/logout');
  },
  me(): Promise<User> {
    return http.get<User>('/auth/me');
  },
};

// ── Produits ─────────────────────────────────────────────────
export const productsService = {
  list(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return http.get<PaginatedResponse<Product>>('/products', filters as Record<string, unknown>);
  },
  show(slug: string): Promise<Product> {
    return http.get<Product>(`/products/${slug}`);
  },
  create(formData: FormData): Promise<Product> {
    return http.postMultipart<Product>('/admin/products', formData);
  },
  update(id: number, formData: FormData): Promise<Product> {
    formData.append('_method', 'PUT');
    return http.postMultipart<Product>(`/admin/products/${id}`, formData);
  },
  delete(id: number): Promise<void> {
    return http.delete<void>(`/admin/products/${id}`);
  },
};

// ── Catégories ───────────────────────────────────────────────
export const categoriesService = {
  list(): Promise<Category[]> {
    return http.get<Category[]>('/categories');
  },
};

// ── Commandes ────────────────────────────────────────────────
export const ordersService = {
  myOrders(): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/orders');
  },
  create(payload: CreateOrderPayload): Promise<Order> {
    return http.post<Order>('/orders', payload);
  },
  adminList(params?: { status?: string; search?: string; page?: number }): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/admin/orders', params as Record<string, unknown>);
  },
  updateStatus(id: number, status: Order['status']): Promise<Order> {
    return http.patch<Order>(`/admin/orders/${id}/status`, { status });
  },
};

// ── Re-exports client ────────────────────────────────────────
export { http, tokenStorage, ApiException } from './client';