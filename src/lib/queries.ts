import { supabase } from './supabase';
import type {
  Category,
  Post,
  Product,
  Collection,
  Hub,
  CollectionProduct,
  HubLink,
} from './types';

export async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name, description, thumbnail_url, sort_order')
    .order('sort_order')
    .returns<Category[]>();
  return data ?? [];
}

export async function getCategoryBySlug(slug: string) {
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name, description, thumbnail_url, sort_order')
    .eq('slug', slug)
    .single<Category>();
  return data;
}

export async function getPublishedPosts(limit = 12, offset = 0) {
  const { data, count } = await supabase
    .from('posts')
    .select(
      'id, slug, title, meta_description, category_id, excerpt, thumbnail_url, published_at, updated_at, reading_time_min, author_name, primary_keyword',
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)
    .returns<Post[]>();
  return { posts: data ?? [], total: count ?? 0 };
}

export async function getCategoryById(categoryId: string) {
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name')
    .eq('id', categoryId)
    .single<Category>();
  return data;
}

export async function getAllPublishedPostSlugs() {
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published');
  return (data ?? []).map((p) => p.slug);
}

export async function getPostsByCategory(categoryId: string, limit = 20) {
  const { data } = await supabase
    .from('posts')
    .select(
      'id, slug, title, meta_description, category_id, excerpt, thumbnail_url, published_at, updated_at, reading_time_min, author_name, primary_keyword'
    )
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .order('published_at', { ascending: false })
    .limit(limit)
    .returns<Post[]>();
  return data ?? [];
}

export async function getPostBySlug(slug: string) {
  const { data } = await supabase
    .from('posts')
    .select(
      'id, slug, title, meta_description, category_id, hub_id, primary_collection_id, content, excerpt, thumbnail_url, status, published_at, updated_at, created_at, word_count, reading_time_min, faq_json, primary_keyword, secondary_keywords, author_name, author_bio, author_image_url'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single<Post>();
  return data;
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, brand, category_id, image_url, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons, is_active'
    )
    .in('id', ids)
    .eq('is_active', true)
    .returns<Product[]>();
  return data ?? [];
}

export async function getPostProducts(postId: string) {
  const { data } = await supabase
    .from('post_products')
    .select('id, post_id, product_id, display_order, context_note')
    .eq('post_id', postId)
    .order('display_order');
  return data ?? [];
}

export async function getCollectionBySlug(slug: string) {
  const { data } = await supabase
    .from('collections')
    .select(
      'id, slug, title, meta_description, description, category_id, thumbnail_url, status, published_at, created_at, updated_at, faq_json'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single<Collection>();
  return data;
}

export async function getCollectionProducts(collectionId: string) {
  const { data } = await supabase
    .from('collection_products')
    .select('id, collection_id, product_id, rank, pick_label, mini_review')
    .eq('collection_id', collectionId)
    .order('rank')
    .returns<CollectionProduct[]>();
  return data ?? [];
}

export async function getHubBySlug(slug: string) {
  const { data } = await supabase
    .from('hubs')
    .select(
      'id, slug, title, meta_description, description, category_id, thumbnail_url, status'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single<Hub>();
  return data;
}

export async function getHubLinks(hubId: string) {
  const { data } = await supabase
    .from('hub_links')
    .select('id, hub_id, target_type, target_id, display_order, label')
    .eq('hub_id', hubId)
    .order('display_order')
    .returns<HubLink[]>();
  return data ?? [];
}

export async function getHubById(hubId: string) {
  const { data } = await supabase
    .from('hubs')
    .select('id, slug, title, meta_description')
    .eq('id', hubId)
    .single<Hub>();
  return data;
}

export async function getCollectionById(collectionId: string) {
  const { data } = await supabase
    .from('collections')
    .select('id, slug, title, meta_description')
    .eq('id', collectionId)
    .single<Collection>();
  return data;
}

export async function getPostsByHub(hubId: string, limit = 12) {
  const { data } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, thumbnail_url, published_at, author_name')
    .eq('hub_id', hubId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
    .returns<Post[]>();
  return data ?? [];
}

export async function getLatestProducts(limit = 6) {
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, brand, category_id, image_url, price, rating, affiliate_url, affiliate_type, search_keyword, badge, pros, cons, is_active'
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<Product[]>();
  return data ?? [];
}

export async function getAllPublishedHubSlugs() {
  const { data } = await supabase
    .from('hubs')
    .select('slug')
    .eq('status', 'published');
  return (data ?? []).map((h) => h.slug);
}

export async function getAllPublishedCollectionSlugs() {
  const { data } = await supabase
    .from('collections')
    .select('slug')
    .eq('status', 'published');
  return (data ?? []).map((c) => c.slug);
}

export async function getPublishedCollections(limit = 10) {
  const { data } = await supabase
    .from('collections')
    .select('id, slug, title, meta_description, thumbnail_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
    .returns<Collection[]>();
  return data ?? [];
}

export async function getCollectionsByCategory(categoryId: string, limit = 10) {
  const { data } = await supabase
    .from('collections')
    .select('id, slug, title, meta_description, thumbnail_url, published_at')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
    .returns<Collection[]>();
  return data ?? [];
}

export interface CollectionWithStats extends Collection {
  product_count: number;
  min_price: number | null;
  max_price: number | null;
}

export async function getCollectionsWithStatsByCategory(
  categoryId: string,
  limit = 10
): Promise<CollectionWithStats[]> {
  const { data: collections } = await supabase
    .from('collections')
    .select('id, slug, title, meta_description, thumbnail_url, published_at')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
    .returns<Collection[]>();

  if (!collections || collections.length === 0) return [];

  const colIds = collections.map((c) => c.id);
  const { data: cpRows } = await supabase
    .from('collection_products')
    .select('collection_id, product_id')
    .in('collection_id', colIds);

  if (!cpRows || cpRows.length === 0) {
    return collections.map((c) => ({ ...c, product_count: 0, min_price: null, max_price: null }));
  }

  const productIds = [...new Set(cpRows.map((r) => r.product_id))];
  const { data: products } = await supabase
    .from('products')
    .select('id, price')
    .in('id', productIds)
    .eq('is_active', true);

  const priceMap = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.price) priceMap.set(p.id, p.price);
  }

  return collections.map((col) => {
    const colProducts = cpRows.filter((r) => r.collection_id === col.id);
    const prices = colProducts
      .map((r) => priceMap.get(r.product_id))
      .filter((p): p is number => p != null);
    return {
      ...col,
      product_count: colProducts.length,
      min_price: prices.length > 0 ? Math.min(...prices) : null,
      max_price: prices.length > 0 ? Math.max(...prices) : null,
    };
  });
}

export async function getTopProductsByEvents(limit = 12) {
  const { data } = await supabase
    .from('events')
    .select('product_id')
    .eq('type', 'outbound')
    .not('product_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!data || data.length === 0) return [];

  // Count occurrences per product_id
  const counts = new Map<string, number>();
  for (const row of data) {
    if (row.product_id) {
      counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
    }
  }

  // Sort by count descending, take top N
  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];
  return getProductsByIds(topIds);
}

export async function getAllCategorySlugs() {
  const { data } = await supabase
    .from('categories')
    .select('slug');
  return (data ?? []).map((c) => c.slug);
}
