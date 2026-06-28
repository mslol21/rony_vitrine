-- ============================================================
-- RONY COSMÉTICOS — SUPABASE MIGRATIONS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANTS (Multi-empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  whatsapp TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tenant
INSERT INTO tenants (name, slug, whatsapp, settings) VALUES (
  'Roony Cosméticos',
  'roony-cosmeticos',
  '5511975915227',
  '{"primary_color": "#4A0D1B", "currency": "BRL", "show_prices": true}'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, slug)
);

-- ============================================================
-- GLOBAL OPTIONS (Colors, Fabrics, Finishes, Sizes)
-- ============================================================
CREATE TABLE IF NOT EXISTS global_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('color', 'fabric', 'finish', 'size')),
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  extra JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_from DECIMAL(10,2),
  production_days INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_customizable BOOLEAN DEFAULT FALSE,
  is_made_to_order BOOLEAN DEFAULT FALSE,
  images JSONB DEFAULT '[]',
  video_url TEXT,
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PRODUCT OPTIONS (which global options a product accepts)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  global_option_id UUID REFERENCES global_options(id) ON DELETE CASCADE,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  UNIQUE(product_id, global_option_id)
);

-- ============================================================
-- INSPIRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS inspirations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  product_ids UUID[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_whatsapp TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_production','shipped','delivered','cancelled')),
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  whatsapp_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  customizations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (catalog is public)
CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT USING (active = TRUE);

CREATE POLICY "Public can read active products"
  ON products FOR SELECT USING (active = TRUE);

CREATE POLICY "Public can read active options"
  ON global_options FOR SELECT USING (active = TRUE);

CREATE POLICY "Public can read active inspirations"
  ON inspirations FOR SELECT USING (active = TRUE);

CREATE POLICY "Public can read product_options"
  ON product_options FOR SELECT USING (TRUE);

CREATE POLICY "Public can read tenants"
  ON tenants FOR SELECT USING (active = TRUE);

-- Allow anonymous order creation (for WhatsApp checkout flow)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT WITH CHECK (TRUE);

-- ADMIN policies (authenticated users can manage everything)
CREATE POLICY "Authenticated can manage categories"
  ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage products"
  ON products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage options"
  ON global_options FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage inspirations"
  ON inspirations FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read all orders"
  ON orders FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- Storage buckets
-- ============================================================
-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('product-videos', 'product-videos', true),
  ('inspiration-images', 'inspiration-images', true),
  ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage buckets
-- 1. product-images
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
CREATE POLICY "Public read access for product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated upload for product-images" ON storage.objects;
CREATE POLICY "Authenticated upload for product-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated update for product-images" ON storage.objects;
CREATE POLICY "Authenticated update for product-images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated delete for product-images" ON storage.objects;
CREATE POLICY "Authenticated delete for product-images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- 2. category-images
DROP POLICY IF EXISTS "Public read access for category-images" ON storage.objects;
CREATE POLICY "Public read access for category-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Authenticated upload for category-images" ON storage.objects;
CREATE POLICY "Authenticated upload for category-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Authenticated update for category-images" ON storage.objects;
CREATE POLICY "Authenticated update for category-images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "Authenticated delete for category-images" ON storage.objects;
CREATE POLICY "Authenticated delete for category-images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'category-images');

-- 3. product-videos
DROP POLICY IF EXISTS "Public read access for product-videos" ON storage.objects;
CREATE POLICY "Public read access for product-videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Authenticated upload for product-videos" ON storage.objects;
CREATE POLICY "Authenticated upload for product-videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Authenticated update for product-videos" ON storage.objects;
CREATE POLICY "Authenticated update for product-videos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Authenticated delete for product-videos" ON storage.objects;
CREATE POLICY "Authenticated delete for product-videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-videos');

-- 4. inspiration-images
DROP POLICY IF EXISTS "Public read access for inspiration-images" ON storage.objects;
CREATE POLICY "Public read access for inspiration-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'inspiration-images');

DROP POLICY IF EXISTS "Authenticated upload for inspiration-images" ON storage.objects;
CREATE POLICY "Authenticated upload for inspiration-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inspiration-images');

DROP POLICY IF EXISTS "Authenticated update for inspiration-images" ON storage.objects;
CREATE POLICY "Authenticated update for inspiration-images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'inspiration-images');

DROP POLICY IF EXISTS "Authenticated delete for inspiration-images" ON storage.objects;
CREATE POLICY "Authenticated delete for inspiration-images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'inspiration-images');
