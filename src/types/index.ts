// ============================================================
// CORE ENTITY TYPES
// ============================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  logo_url?: string;
  settings: TenantSettings;
  created_at: string;
}

export interface TenantSettings {
  primary_color?: string;
  accent_color?: string;
  banner_text?: string;
  show_prices?: boolean;
  currency?: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  order: number;
  active: boolean;
}

export type GlobalOptionType = 'color' | 'fabric' | 'finish' | 'size';

export interface GlobalOption {
  id: string;
  tenant_id: string;
  type: GlobalOptionType;
  name: string;
  value: string;
  extra?: {
    hex?: string;
    texture?: string;
    price_modifier?: number;
    description?: string;
  };
  active: boolean;
}

export interface ProductOption {
  id: string;
  product_id: string;
  global_option_id: string;
  price_modifier: number;
  option?: GlobalOption;
}

export interface ProductImage {
  url: string;
  alt: string;
  order: number;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  price_from?: number;
  production_days?: number;
  is_featured: boolean;
  is_new: boolean;
  is_customizable: boolean;
  is_made_to_order: boolean;
  images: ProductImage[];
  video_url?: string;
  tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  options?: ProductOption[];
}

// ============================================================
// ORDER TYPES
// ============================================================

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';

export interface CustomizationData {
  cor?: string;
  tecido?: string;
  acabamento?: string;
  tamanho?: string;
  nome?: string;
  observacoes?: string;
  [key: string]: string | undefined;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  customizations: CustomizationData;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_whatsapp: string;
  status: OrderStatus;
  total: number;
  notes?: string;
  whatsapp_sent_at?: string;
  created_at: string;
  items?: OrderItem[];
}

// ============================================================
// INSPIRATION TYPES
// ============================================================

export interface Inspiration {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  image_url: string;
  product_ids: string[];
  products?: Product[];
  active: boolean;
  created_at: string;
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customizations: CustomizationData;
  unit_price: number;
  total_price: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity: number, customizations: CustomizationData, price: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// ============================================================
// FAVORITES TYPES
// ============================================================

export interface FavoritesState {
  ids: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clear: () => void;
}

// ============================================================
// FILTER TYPES
// ============================================================

export interface CatalogFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  is_featured?: boolean;
  is_new?: boolean;
  is_customizable?: boolean;
  search?: string;
}

// ============================================================
// ADMIN TYPES
// ============================================================

export interface DashboardMetrics {
  total_products: number;
  total_categories: number;
  total_orders: number;
  total_revenue: number;
  recent_orders: Order[];
  top_products: Array<{ product: Product; views: number }>;
}

// ============================================================
// WHATSAPP TYPES
// ============================================================

export interface WhatsAppMessage {
  phone: string;
  message: string;
  url: string;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface ProductFormData {
  name: string;
  category_id: string;
  description: string;
  price: number;
  price_from?: number;
  production_days?: number;
  is_featured: boolean;
  is_new: boolean;
  is_customizable: boolean;
  is_made_to_order: boolean;
  tags: string;
  video_url?: string;
  active: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  order: number;
  active: boolean;
  image_url?: string;
}

export interface GlobalOptionFormData {
  type: GlobalOptionType;
  name: string;
  value: string;
  hex?: string;
  price_modifier?: number;
  description?: string;
  active: boolean;
}
