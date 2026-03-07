#!/usr/bin/env tsx
/**
 * 독립 실행 자동 포스팅 스크립트
 * GitHub Actions 또는 로컬에서 직접 실행 (Vercel 의존성 없음)
 *
 * Usage:
 *   npx tsx scripts/generate-posts.ts
 *   npx tsx scripts/generate-posts.ts --count 2
 *   npx tsx scripts/generate-posts.ts --category electronics
 */

import { createClient } from '@supabase/supabase-js';
import { generateKeywords } from './lib/keyword-generator';
import { searchProducts } from './lib/coupang-api';
import { generateContent, getRecentTemplateIds } from './lib/content-generator';
import { koreanToSlug } from './lib/slug-utils';

const AFFILIATE_DISCLOSURE =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';

const CATEGORIES = ['electronics', 'car-accessories', 'camping-outdoor'] as const;
type CategorySlug = (typeof CATEGORIES)[number];

// --- Supabase client ---
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key);
}

// --- CLI args ---
function parseArgs() {
  const args = process.argv.slice(2);
  let count = 1;
  let category: CategorySlug | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1] as CategorySlug;
      i++;
    }
  }
  return { count, category };
}

// --- Category rotation ---
// dayOfYear + current hour로 회전 → 같은 날 다른 시간에 다른 카테고리 선택
function getCategoryForRun(): CategorySlug {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const hourSlot = Math.floor(now.getUTCHours() / 2); // 0~11, 2시간 단위
  const index = (dayOfYear * 4 + hourSlot) % CATEGORIES.length;
  return CATEGORIES[index];
}

// --- Random publish time ---
function getRandomPublishedAt(): string {
  const now = new Date();
  const hours = [7, 10, 14, 19];
  const hour = hours[Math.floor(Math.random() * hours.length)];
  const minute = Math.floor(Math.random() * 50) + 5;
  now.setUTCHours(hour - 9, minute, 0, 0);
  return now.toISOString();
}

interface PostResult {
  keyword: string;
  slug: string;
  category: string;
  ok: boolean;
  source?: string;
  error?: string;
}

// --- DB fallback ---
async function generateFromDbFallback(
  categorySlug: CategorySlug,
  usedTemplateIds: number[],
): Promise<PostResult> {
  const supabase = getSupabase();

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, source: 'db-fallback', error: 'Category not found' };
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, image_url, affiliate_url, search_keyword, is_active')
    .eq('category_id', category.id)
    .eq('is_active', true);

  if (!products || products.length === 0) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, source: 'db-fallback', error: 'No DB products' };
  }

  const keywordMap = new Map<string, typeof products>();
  for (const p of products) {
    const kw = p.search_keyword || p.name.split(' ').slice(0, 2).join(' ');
    if (!keywordMap.has(kw)) keywordMap.set(kw, []);
    keywordMap.get(kw)!.push(p);
  }

  const { data: existingPosts } = await supabase
    .from('posts')
    .select('primary_keyword')
    .eq('category_id', category.id);
  const usedKeywords = new Set((existingPosts ?? []).map((p) => p.primary_keyword));

  const available = [...keywordMap.entries()]
    .filter(([kw]) => !usedKeywords.has(kw))
    .filter(([, prods]) => prods.length >= 3);

  if (available.length === 0) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, source: 'db-fallback', error: 'No unused keywords with enough products' };
  }

  const [keyword, keywordProducts] = available[0];
  const top5 = keywordProducts.slice(0, 5);

  let slug = koreanToSlug(keyword);
  // Ensure year suffix
  const year = new Date().getFullYear().toString();
  if (!slug.includes(year)) {
    slug = `${slug}-${year}`;
  }

  // Handle slug collision
  const { data: existingSlug } = await supabase.from('posts').select('id').eq('slug', slug).single();
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const { data: existingSlug2 } = await supabase.from('posts').select('id').eq('slug', slug).single();
    if (existingSlug2) {
      return { keyword, slug, category: categorySlug, ok: false, source: 'db-fallback', error: 'Slug exists' };
    }
  }

  const fakeResult = {
    landingUrl: top5[0].affiliate_url,
    products: top5.map((p, i) => ({
      productId: i,
      productName: p.name,
      productPrice: p.price ?? 0,
      productImage: p.image_url ?? '',
      productUrl: p.affiliate_url,
      keyword,
      rank: i + 1,
      isRocket: true,
      isFreeShipping: true,
    })),
  };

  const generated = await generateContent(keyword, slug, fakeResult, categorySlug, usedTemplateIds);

  const templateData = {
    template_id: generated.template_id,
    hero_subtitle: generated.hero_subtitle,
    urgency: generated.urgency,
    situation_picks: generated.situation_picks,
    products_extra: generated.products.map((p) => ({
      emotion_summary: p.emotion_summary,
      spec_descriptions: p.spec_descriptions,
      editor_comment: p.editor_comment,
    })),
  };
  const content = `> ${AFFILIATE_DISCLOSURE}\n\n<!--TEMPLATE:${JSON.stringify(templateData)}-->\n${generated.content}`;
  const pubDate = getRandomPublishedAt();

  // Insert collection
  const collSlug = `${slug}-top`;
  const { data: collection } = await supabase
    .from('collections')
    .insert({
      slug: collSlug,
      title: `${keyword} TOP ${top5.length}`,
      meta_description: generated.meta_description,
      description: generated.hero_subtitle,
      category_id: category.id,
      thumbnail_url: top5[0].image_url,
      status: 'published',
      published_at: pubDate,
      faq_json: generated.faq_json,
    })
    .select('id')
    .single();

  if (collection) {
    const cpInserts = top5.map((p, i) => ({
      collection_id: collection.id,
      product_id: p.id,
      rank: i + 1,
      pick_label: generated.products[i]?.pick_label ?? null,
      mini_review: generated.products[i]?.emotion_summary ?? null,
    }));
    await supabase.from('collection_products').insert(cpInserts);
  }

  // Insert post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      slug,
      title: generated.title,
      meta_description: generated.meta_description,
      category_id: category.id,
      primary_collection_id: collection?.id ?? null,
      content,
      excerpt: generated.hero_subtitle,
      thumbnail_url: top5[0].image_url,
      status: 'published',
      published_at: pubDate,
      word_count: generated.content.length,
      reading_time_min: Math.max(1, Math.round(generated.content.length / 500)),
      faq_json: generated.faq_json,
      primary_keyword: generated.primary_keyword,
      secondary_keywords: generated.secondary_keywords,
      author_name: '에디터',
      author_bio: '제품 리뷰와 비교 분석을 전문으로 하는 에디터',
    })
    .select('id')
    .single();

  if (postError || !post) {
    return { keyword, slug, category: categorySlug, ok: false, source: 'db-fallback', error: postError?.message };
  }

  const ppInserts = top5.map((p, i) => ({
    post_id: post.id,
    product_id: p.id,
    display_order: i + 1,
  }));
  await supabase.from('post_products').insert(ppInserts);

  return { keyword, slug, category: categorySlug, ok: true, source: 'db-fallback' };
}

// --- Main post generation ---
async function generateOnePost(
  categorySlug: CategorySlug,
  usedTemplateIds: number[],
): Promise<PostResult> {
  const supabase = getSupabase();

  // 1. Generate keyword
  const keywords = await generateKeywords(categorySlug, 1);
  if (keywords.length === 0) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, error: 'No keywords generated' };
  }

  const { keyword, slug } = keywords[0];

  // 2. Check slug
  const { data: existing } = await supabase.from('posts').select('id').eq('slug', slug).single();
  if (existing) {
    return { keyword, slug, category: categorySlug, ok: false, error: `Slug "${slug}" exists` };
  }

  // 3. Get category ID
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) {
    return { keyword, slug, category: categorySlug, ok: false, error: 'Category not found' };
  }

  // 4. Search Coupang
  let coupangResult;
  try {
    coupangResult = await searchProducts(keyword, 5);
    if (coupangResult.products.length === 0) {
      throw new Error('No products found');
    }
  } catch (coupangError) {
    console.log(`  Coupang API failed for "${keyword}": ${coupangError instanceof Error ? coupangError.message : 'Unknown'}. Falling back to DB.`);
    return generateFromDbFallback(categorySlug, usedTemplateIds);
  }

  // 5. Generate content
  const generated = await generateContent(keyword, slug, coupangResult, categorySlug, usedTemplateIds);

  const templateData = {
    template_id: generated.template_id,
    hero_subtitle: generated.hero_subtitle,
    urgency: generated.urgency,
    situation_picks: generated.situation_picks,
    products_extra: generated.products.map((p) => ({
      emotion_summary: p.emotion_summary,
      spec_descriptions: p.spec_descriptions,
      editor_comment: p.editor_comment,
    })),
  };
  const contentWithTemplate = `> ${AFFILIATE_DISCLOSURE}\n\n<!--TEMPLATE:${JSON.stringify(templateData)}-->\n${generated.content}`;

  // 6. Insert products
  const firstProductImage = coupangResult.products[0]?.productImage ?? null;
  const productInserts = generated.products.map((p, i) => ({
    name: p.name,
    brand: p.brand,
    category_id: category.id,
    image_url: coupangResult.products[i]?.productImage ?? null,
    price: coupangResult.products[i]?.productPrice ?? p.price,
    affiliate_url: coupangResult.products[i]?.productUrl ?? coupangResult.landingUrl,
    affiliate_type: 'search' as const,
    search_keyword: keyword,
    badge: p.pick_label,
    pros: p.target_audience,
    cons: p.cautions,
    is_active: true,
  }));

  const { data: insertedProducts, error: prodError } = await supabase
    .from('products')
    .insert(productInserts)
    .select('id');

  if (prodError || !insertedProducts) {
    return { keyword, slug, category: categorySlug, ok: false, error: prodError?.message };
  }

  // 7. Insert collection
  const collectionSlug = `${slug}-top`;
  const { data: collection, error: colError } = await supabase
    .from('collections')
    .insert({
      slug: collectionSlug,
      title: `${keyword} TOP ${generated.products.length}`,
      meta_description: generated.meta_description,
      description: generated.hero_subtitle,
      category_id: category.id,
      thumbnail_url: firstProductImage,
      status: 'published',
      published_at: new Date().toISOString(),
      faq_json: generated.faq_json,
    })
    .select('id')
    .single();

  if (colError || !collection) {
    return { keyword, slug, category: categorySlug, ok: false, error: colError?.message };
  }

  // 8. collection_products
  const cpInserts = insertedProducts.map((prod, i) => ({
    collection_id: collection.id,
    product_id: prod.id,
    rank: generated.products[i]?.rank ?? i + 1,
    pick_label: generated.products[i]?.pick_label ?? null,
    mini_review: generated.products[i]?.emotion_summary ?? null,
  }));
  await supabase.from('collection_products').insert(cpInserts);

  // 9. Insert post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      slug,
      title: generated.title,
      meta_description: generated.meta_description,
      category_id: category.id,
      primary_collection_id: collection.id,
      content: contentWithTemplate,
      excerpt: generated.hero_subtitle,
      thumbnail_url: firstProductImage,
      status: 'published',
      published_at: getRandomPublishedAt(),
      word_count: generated.content.length,
      reading_time_min: Math.max(1, Math.round(generated.content.length / 500)),
      faq_json: generated.faq_json,
      primary_keyword: generated.primary_keyword,
      secondary_keywords: generated.secondary_keywords,
      author_name: '에디터',
      author_bio: '제품 리뷰와 비교 분석을 전문으로 하는 에디터',
    })
    .select('id')
    .single();

  if (postError || !post) {
    return { keyword, slug, category: categorySlug, ok: false, error: postError?.message };
  }

  // 10. post_products
  const ppInserts = insertedProducts.map((prod, i) => ({
    post_id: post.id,
    product_id: prod.id,
    display_order: i + 1,
  }));
  await supabase.from('post_products').insert(ppInserts);

  return { keyword, slug, category: categorySlug, ok: true, source: 'coupang-api' };
}

// --- Entry point ---
async function main() {
  console.log('=== Auto Post Generator ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // Validate env
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'COUPANG_PARTNERS_ACCESS_KEY', 'COUPANG_PARTNERS_SECRET_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const { count, category } = parseArgs();
  const categories = category
    ? Array.from({ length: count }, () => category)
    : Array.from({ length: count }, () => getCategoryForRun());

  console.log(`Generating ${categories.length} post(s): ${categories.join(', ')}`);

  const recentTemplateIds = await getRecentTemplateIds(5);
  const usedTemplateIds = [...recentTemplateIds];
  const results: PostResult[] = [];

  for (const cat of categories) {
    console.log(`\n--- Generating for: ${cat} ---`);
    try {
      const result = await generateOnePost(cat, usedTemplateIds);
      results.push(result);
      if (result.ok) {
        console.log(`  OK: "${result.keyword}" → /blog/${result.slug} (${result.source})`);
      } else {
        console.log(`  FAIL: ${result.error}`);
        // Try DB fallback
        try {
          const fallback = await generateFromDbFallback(cat, usedTemplateIds);
          results.push(fallback);
          if (fallback.ok) {
            console.log(`  FALLBACK OK: "${fallback.keyword}" → /blog/${fallback.slug}`);
          } else {
            console.log(`  FALLBACK FAIL: ${fallback.error}`);
          }
        } catch (fbErr) {
          console.log(`  FALLBACK ERROR: ${fbErr instanceof Error ? fbErr.message : 'Unknown'}`);
        }
      }
    } catch (error) {
      console.error(`  ERROR: ${error instanceof Error ? error.message : 'Unknown'}`);
      results.push({ keyword: '', slug: '', category: cat, ok: false, error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  // Log to daily_jobs
  try {
    const supabase = getSupabase();
    await supabase.from('daily_jobs').insert({
      job_type: 'post_generate',
      status: results.some((r) => r.ok) ? 'done' : 'failed',
      result_json: { results, source: 'github-actions' },
      completed_at: new Date().toISOString(),
    });
  } catch {
    console.log('Warning: Failed to log job result');
  }

  const successCount = results.filter((r) => r.ok).length;
  console.log(`\n=== Done: ${successCount}/${results.length} succeeded ===`);

  if (successCount === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
