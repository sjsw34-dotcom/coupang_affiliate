// Database row types — 1:1 matching with Supabase tables

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category_id: string;
  image_url: string | null;
  price: number | null;
  rating: number | null;
  affiliate_url: string;
  affiliate_type: 'search' | 'product';
  search_keyword: string | null;
  badge: string | null;
  pros: string[];
  cons: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Hub {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  description: string | null;
  category_id: string;
  thumbnail_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string | null;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  description: string | null;
  category_id: string;
  thumbnail_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  faq_json: FaqItem[] | null;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  category_id: string;
  hub_id: string | null;
  primary_collection_id: string | null;
  content: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  updated_at: string | null;
  created_at: string;
  word_count: number | null;
  reading_time_min: number | null;
  faq_json: FaqItem[] | null;
  primary_keyword: string;
  secondary_keywords: string[];
  author_name: string;
  author_bio: string | null;
  author_image_url: string | null;
}

export interface PostProduct {
  id: string;
  post_id: string;
  product_id: string;
  display_order: number;
  context_note: string | null;
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  product_id: string;
  rank: number;
  pick_label: string | null;
  mini_review: string | null;
}

export interface HubLink {
  id: string;
  hub_id: string;
  target_type: 'post' | 'collection';
  target_id: string;
  display_order: number;
  label: string | null;
}

export interface Event {
  id: string;
  type: 'click' | 'outbound' | 'cta_view';
  page_slug: string;
  target_url: string | null;
  product_id: string | null;
  position: number | null;
  user_agent: string | null;
  referer: string | null;
  created_at: string;
}

export interface DailyJob {
  id: string;
  job_type: 'post_generate' | 'sitemap_refresh';
  status: 'pending' | 'running' | 'done' | 'failed';
  result_json: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

// Client-side event tracking payload
export interface TrackEvent {
  type: 'click' | 'outbound' | 'cta_view';
  page_slug: string;
  target_url?: string;
  product_id?: string;
  position?: number;
}

// Joined types for rendering
export interface CollectionProductWithProduct extends CollectionProduct {
  product: Product;
}

export interface PostWithCategory extends Post {
  category: Category;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}
