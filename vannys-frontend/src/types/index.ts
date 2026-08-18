// ─── Auth & Users ──────────────────────────────────────────────

// Les valeurs correspondent à l'enum MySQL : enum('user','admin') — minuscules
export type Role = 'user' | 'admin';

export interface User {
  id: string; // BigInt sérialisé en string
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Categories ────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
}

// ─── Products ──────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  cloudinaryId: string;
  url: string;
  urlThumbnail?: string;
  urlMedium?: string;
  isPrimary: boolean;
  sortOrder: number;
}

/** Combinaison vendable : c'est elle qui porte le stock (lot L1). */
export interface ProductVariant {
  id: string;
  size?: string | null;
  color?: string | null;
  stock: number;
  sku?: string | null;
  isActive: boolean;
}

/** Disponibilité calculée par le serveur à partir du stock des variantes. */
export type Availability = 'available' | 'low_stock' | 'out_of_stock' | 'disabled';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  rating: number;
  reviewsCount: number;
  reference: string;
  lowStockThreshold: number;
  totalStock: number;
  availability: Availability;
  /** @deprecated Dérivé de `availability` ; conservé le temps d'une version. */
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

// ─── Orders ────────────────────────────────────────────────────

// Valeurs de l'enum MySQL orders_status
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  variantColor?: string;
  variantSize?: string;
}

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  notes?: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  trackingNumber?: string;
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryCity: string;
  deliveryDistrict: string;
  deliveryAddress: string;
  deliveryLandmark?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;
}

// ─── API responses ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

// ─── Product filter params ─────────────────────────────────────

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?: 'price' | 'rating' | 'createdAt';
  dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
