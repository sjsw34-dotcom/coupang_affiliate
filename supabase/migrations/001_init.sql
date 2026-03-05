-- ============================================
-- Coupang Affiliate Site - Initial Migration
-- 실행 순서: categories → products → hubs → collections → posts
--           → post_products → collection_products → hub_links
--           → events → daily_jobs
-- ============================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  category_id uuid REFERENCES categories(id),
  image_url text,
  price int,
  rating numeric(2,1),
  affiliate_url text NOT NULL,
  affiliate_type text DEFAULT 'search' CHECK (affiliate_type IN ('search', 'product')),
  search_keyword text,
  badge text,
  pros text[] DEFAULT '{}',
  cons text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- 3. Hubs
CREATE TABLE IF NOT EXISTS hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  description text,
  category_id uuid REFERENCES categories(id),
  thumbnail_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- 4. Collections
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  description text,
  category_id uuid REFERENCES categories(id),
  thumbnail_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  faq_json jsonb
);

-- 5. Posts
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  category_id uuid REFERENCES categories(id),
  hub_id uuid REFERENCES hubs(id),
  primary_collection_id uuid REFERENCES collections(id),
  content text,
  excerpt text,
  thumbnail_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  word_count int,
  reading_time_min int,
  faq_json jsonb,
  primary_keyword text NOT NULL,
  secondary_keywords text[] DEFAULT '{}',
  author_name text DEFAULT '에디터',
  author_bio text,
  author_image_url text
);

-- 6. Post-Product junction
CREATE TABLE IF NOT EXISTS post_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  display_order int,
  context_note text
);

-- 7. Collection-Product junction
CREATE TABLE IF NOT EXISTS collection_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  rank int,
  pick_label text,
  mini_review text
);

-- 8. Hub links
CREATE TABLE IF NOT EXISTS hub_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid REFERENCES hubs(id) ON DELETE CASCADE,
  target_type text CHECK (target_type IN ('post', 'collection')),
  target_id uuid,
  display_order int,
  label text
);

-- 9. Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('click', 'outbound', 'cta_view')),
  page_slug text NOT NULL,
  target_url text,
  product_id uuid REFERENCES products(id),
  position int,
  user_agent text,
  referer text,
  created_at timestamptz DEFAULT now()
);

-- 10. Daily Jobs (Phase 2)
CREATE TABLE IF NOT EXISTS daily_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text CHECK (job_type IN ('post_generate', 'sitemap_refresh')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  result_json jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================
-- Indexes
-- ============================================

-- posts
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_primary_keyword ON posts(primary_keyword) WHERE status = 'published';

-- products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- events
CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_page ON events(page_slug);

-- collections
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

-- hubs
CREATE UNIQUE INDEX IF NOT EXISTS idx_hubs_slug ON hubs(slug);
