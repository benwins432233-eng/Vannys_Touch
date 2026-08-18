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
  /** Nul tant que l'adresse n'a pas été confirmée — la commande l'exige. */
  email_verified_at?: string | null;
  createdAt: string;
}

/** Adresse enregistrée du carnet. La commande en garde une copie figée. */
export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  landmark?: string | null;
  isDefault: boolean;
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

// ─── Réglages de boutique ──────────────────────────────────────

/** Modes de règlement acceptés par le tunnel de commande. */
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'MTN' | 'MOOV' | 'ORANGE' | 'CELTIIS';

/**
 * Réglages servis par `GET /settings`.
 * Les clés portent un point : elles sont accédées par index, jamais par `.`.
 */
export interface ShopSettings {
  'shipping.fee': number;
  'shipping.freeThreshold': number;
  'shipping.message': string;
  'shop.name': string;
  'shop.phone': string;
  'shop.whatsapp': string;
  'shop.email': string;
  'shop.address': string;
  'payment.methods': PaymentMethod[];
}

/** Description d'un champ éditable, fournie par l'administration. */
export interface SettingField {
  key: keyof ShopSettings;
  type: 'string' | 'number' | 'boolean' | 'json';
  label: string;
}

// ─── Notifications ─────────────────────────────────────────────

/**
 * Types connus. La colonne est une chaîne côté base : un type inconnu doit
 * s'afficher proprement plutôt que casser la page.
 */
export type NotificationType =
  | 'order_created'
  | 'order_status_changed'
  | 'order_cancelled'
  | 'low_stock'
  | 'admin_new_order';

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  /** Chemin interne vers la ressource concernée. */
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationFeed {
  items: AppNotification[];
  unreadCount: number;
  meta: { total: number; page: number; limit: number; lastPage: number };
}

// ─── Panier serveur ────────────────────────────────────────────

/** Ligne du panier telle que le serveur la renvoie : prix et stock relus en base. */
export interface ServerCartLine {
  id: string;
  variantId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  stock: number;
  /** Faux dès que la ligne bloque la commande (épuisée, retirée, quantité trop haute). */
  available: boolean;
  alert?: string;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  };
}

export interface ServerCart {
  items: ServerCartLine[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  hasIssues: boolean;
  /** Message ponctuel : quantité ajustée, articles ignorés à la fusion… */
  notice?: string;
  /** Nombre de lignes locales non reprises, renvoyé par `POST /cart/merge`. */
  skipped?: number;
}

// ─── Orders ────────────────────────────────────────────────────

// Valeurs de l'enum MySQL orders_status. `processing` signifie « en préparation » :
// la valeur existait avant le lot L3 et n'a pas été renommée, MySQL stockant
// l'indice d'un ENUM et non son texte.
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivery_failed'
  | 'delivered'
  | 'cancelled';

/** Une étape de la vie d'une commande. */
export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  comment?: string | null;
  createdAt: string;
  changedBy?: { id: string; firstName: string; lastName: string } | null;
}

/** Transition proposée par le serveur depuis l'état courant. */
export interface OrderTransition {
  status: OrderStatus;
  label: string;
}

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
  cancelledAt?: string | null;
  /** Présent sur le détail : le serveur dit si l'annulation est encore possible. */
  canCancel?: boolean;
  statusHistory?: OrderStatusHistoryEntry[];
  /** Présent sur `GET /orders/admin/:id` uniquement. */
  allowedTransitions?: OrderTransition[];
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
