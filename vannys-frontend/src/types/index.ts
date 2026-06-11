// ============================================================
// src/types/index.ts
// Types alignés sur les réponses de l'API Laravel
// ============================================================

// ---------- Pagination Laravel standard ----------
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// ---------- Catégorie ----------
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  color: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---------- Image produit (Cloudinary) ----------
export interface ProductImage {
  id: number;
  product_id: number;
  cloudinary_id: string;
  url: string;
  url_thumbnail: string | null;
  url_medium: string | null;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

// ---------- Variante produit ----------
export interface ProductVariant {
  id: number;
  product_id: number;
  type: 'color' | 'size';
  value: string;
}

// ---------- Produit ----------
export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  badge: string | null;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  // Accesseurs calculés
  image_url?: string;           // image principale (backend accessor)
  colors?: string[];            // extraits des variants
  sizes?: string[];
}

// ---------- Avis ----------
export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  user?: Pick<User, 'id' | 'first_name' | 'last_name'>;
}

// ---------- Utilisateur ----------
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: 'user' | 'admin';
  avatar_url: string | null;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Panier (état local) ----------
export interface CartItem {
  product: Product;
  quantity: number;
  selected_color?: string;
  selected_size?: string;
}

// ---------- Commande ----------
export interface Order {
  id: number;
  user_id: number;
  reference: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  payment_method: 'MTN' | 'MOOV' | 'ORANGE';
  phone_number: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  variant_color: string | null;
  variant_size: string | null;
  created_at: string;
  product?: Product;
}

// ---------- Auth ----------
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

// ---------- Filtres produits ----------
export interface ProductFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'default';
  page?: number;
  per_page?: number;
}

// ---------- Payload création commande ----------
export interface CreateOrderPayload {
  payment_method: 'MTN' | 'MOOV' | 'ORANGE';
  phone_number: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    color?: string;
    size?: string;
  }[];
}

// ---------- Erreur API ----------
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
