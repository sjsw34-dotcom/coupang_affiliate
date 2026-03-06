import { NextRequest, NextResponse } from 'next/server';
import { generateKeywords } from '@/lib/keyword-generator';
import { searchProducts } from '@/lib/coupang-api';
import { generateContent, getRecentTemplateIds } from '@/lib/content-generator';
import { getServiceClient } from '@/lib/supabase';
import { AFFILIATE_DISCLOSURE } from '@/lib/constants';
import type { CoupangSearchResult } from '@/lib/coupang-api';

const CATEGORIES = ['electronics', 'car-accessories', 'camping-outdoor'] as const;

// Daily: 4 posts total, rotating categories. Spread across day.
function getCategoriesForToday(): (typeof CATEGORIES)[number][] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return Array.from({ length: 4 }, (_, i) => CATEGORIES[(dayOfYear + i) % CATEGORIES.length]);
}

// Randomize published_at across the day (looks natural to Google)
function getRandomPublishedAt(): string {
  const now = new Date();
  const hours = [7, 10, 14, 19]; // realistic posting hours (KST)
  const hour = hours[Math.floor(Math.random() * hours.length)];
  const minute = Math.floor(Math.random() * 50) + 5; // 5~54
  now.setUTCHours(hour - 9, minute, 0, 0); // KST -> UTC
  return now.toISOString();
}

interface PostResult {
  keyword: string;
  slug: string;
  category: string;
  ok: boolean;
  source?: 'coupang-api' | 'db-fallback';
  error?: string;
}

// Fallback: generate from existing DB products when Coupang API fails
async function generateFromDbFallback(
  categorySlug: (typeof CATEGORIES)[number],
  usedTemplateIds: number[],
): Promise<PostResult> {
  const supabase = getServiceClient();

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, source: 'db-fallback', error: 'Category not found' };
  }

  // Get active products in this category
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, image_url, affiliate_url, search_keyword, is_active')
    .eq('category_id', category.id)
    .eq('is_active', true);

  if (!products || products.length === 0) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, source: 'db-fallback', error: 'No DB products' };
  }

  // Group by search_keyword
  const keywordMap = new Map<string, typeof products>();
  for (const p of products) {
    const kw = p.search_keyword || p.name.split(' ').slice(0, 2).join(' ');
    if (!keywordMap.has(kw)) keywordMap.set(kw, []);
    keywordMap.get(kw)!.push(p);
  }

  // Get existing post keywords to avoid duplicates
  const { data: existingPosts } = await supabase
    .from('posts')
    .select('primary_keyword')
    .eq('category_id', category.id);
  const usedKeywords = new Set((existingPosts ?? []).map((p) => p.primary_keyword));

  // Pick unused keyword with >= 3 products
  const available = [...keywordMap.entries()]
    .filter(([kw]) => !usedKeywords.has(kw))
    .filter(([, prods]) => prods.length >= 3);

  if (available.length === 0) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, source: 'db-fallback', error: 'No unused keywords with enough products' };
  }

  const [keyword, keywordProducts] = available[0];
  const top5 = keywordProducts.slice(0, 5);

  const slug = keyword
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[가-힣]+/g, (m) => encodeURIComponent(m))
    .replace(/%/g, '')
    .substring(0, 50) || `review-${Date.now()}`;

  // Check slug exists
  const { data: existingSlug } = await supabase.from('posts').select('id').eq('slug', slug).single();
  if (existingSlug) {
    return { keyword, slug, category: categorySlug, ok: false, source: 'db-fallback', error: 'Slug exists' };
  }

  // Build CoupangSearchResult from DB products
  const fakeResult: CoupangSearchResult = {
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
  const disclosure = `> ${AFFILIATE_DISCLOSURE}\n\n`;
  const content = `${disclosure}<!--TEMPLATE:${JSON.stringify(templateData)}-->\n${generated.content}`;

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

  // Insert post_products
  const ppInserts = top5.map((p, i) => ({
    post_id: post.id,
    product_id: p.id,
    display_order: i + 1,
  }));
  await supabase.from('post_products').insert(ppInserts);

  return { keyword, slug, category: categorySlug, ok: true, source: 'db-fallback' };
}

async function generateOnePost(
  categorySlug: (typeof CATEGORIES)[number],
  usedTemplateIds: number[],
): Promise<PostResult> {
  const supabase = getServiceClient();

  // 1. Generate keyword
  const keywords = await generateKeywords(categorySlug, 1);
  if (keywords.length === 0) {
    return { keyword: '', slug: '', category: categorySlug, ok: false, error: 'No keywords generated' };
  }

  const { keyword, slug } = keywords[0];

  // 2. Check slug doesn't exist
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .single();

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

  // 4. Search Coupang (with fallback)
  let coupangResult: CoupangSearchResult;
  try {
    coupangResult = await searchProducts(keyword, 5);
    if (coupangResult.products.length === 0) {
      throw new Error('No products found');
    }
  } catch (coupangError) {
    // Coupang API failed -> fallback to DB products
    console.log(`Coupang API failed for "${keyword}": ${coupangError instanceof Error ? coupangError.message : 'Unknown'}. Falling back to DB.`);
    return generateFromDbFallback(categorySlug, usedTemplateIds);
  }

  // 5. Generate content (with template rotation)
  const generated = await generateContent(keyword, slug, coupangResult, categorySlug, usedTemplateIds);

  // 5.5. Build template data (include template_id for tracking)
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
  const disclosure = `> ${AFFILIATE_DISCLOSURE}\n\n`;
  const contentWithTemplate = `${disclosure}<!--TEMPLATE:${JSON.stringify(templateData)}-->\n${generated.content}`;

  // 6. Insert products (pros=target_audience, cons=cautions)
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

  // 8. Insert collection_products
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

  // 10. Insert post_products
  const ppInserts = insertedProducts.map((prod, i) => ({
    post_id: post.id,
    product_id: prod.id,
    display_order: i + 1,
  }));
  await supabase.from('post_products').insert(ppInserts);

  return { keyword, slug, category: categorySlug, ok: true, source: 'coupang-api' };
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const secret = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();
    const todayCategories = getCategoriesForToday();
    const results: PostResult[] = [];

    // Load recent template IDs to avoid repeats
    const recentTemplateIds = await getRecentTemplateIds(5);
    const usedTemplateIds = [...recentTemplateIds];

    // Generate 4 posts sequentially (to avoid API rate limits)
    for (const cat of todayCategories) {
      try {
        const result = await generateOnePost(cat, usedTemplateIds);
        results.push(result);
        // Track template used in this batch too (extract from result if successful)
        // The template_id is embedded in the content, so future posts in this batch will see it
      } catch (error) {
        // Top-level fallback: try DB if generateOnePost itself throws
        try {
          const fallbackResult = await generateFromDbFallback(cat, usedTemplateIds);
          results.push(fallbackResult);
        } catch (fallbackError) {
          results.push({
            keyword: '',
            slug: '',
            category: cat,
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Log job
    await supabase.from('daily_jobs').insert({
      job_type: 'post_generate',
      status: results.some((r) => r.ok) ? 'done' : 'failed',
      result_json: { results },
      completed_at: new Date().toISOString(),
    });

    const successCount = results.filter((r) => r.ok).length;

    return NextResponse.json({
      ok: successCount > 0,
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
