import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { generateContent, getRecentTemplateIds } from '@/lib/content-generator';
import { AFFILIATE_DISCLOSURE } from '@/lib/constants';
import type { CoupangSearchResult } from '@/lib/coupang-api';

// Generate posts using existing DB products (no Coupang API calls)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { count: postCount = 3, category: targetCategory } = await req.json().catch(() => ({}));
  const supabase = getServiceClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name')
    .order('sort_order');

  if (!categories) {
    return NextResponse.json({ error: 'No categories' }, { status: 500 });
  }

  const targetCats = targetCategory
    ? categories.filter((c) => c.slug === targetCategory)
    : categories;

  const results: { category: string; keyword: string; slug: string; ok: boolean; error?: string }[] = [];

  // Load recent template IDs to avoid repeats
  const recentTemplateIds = await getRecentTemplateIds(5);
  const usedTemplateIds = [...recentTemplateIds];

  for (const cat of targetCats) {
    // Get distinct search keywords that have products in this category
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, image_url, affiliate_url, search_keyword, is_active')
      .eq('category_id', cat.id)
      .eq('is_active', true);

    if (!products || products.length === 0) continue;

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
      .eq('category_id', cat.id);
    const usedKeywords = new Set((existingPosts ?? []).map((p) => p.primary_keyword));

    // Pick unused keywords
    const availableKeywords = [...keywordMap.entries()]
      .filter(([kw]) => !usedKeywords.has(kw))
      .filter(([, prods]) => prods.length >= 3);

    const toGenerate = availableKeywords.slice(0, postCount);

    for (const [keyword, keywordProducts] of toGenerate) {
      try {
        const top5 = keywordProducts.slice(0, 5);
        const slug = keyword
          .replace(/[^\w\s가-힣]/g, '')
          .replace(/\s+/g, '-')
          .toLowerCase()
          .replace(/[가-힣]+/g, (m) => encodeURIComponent(m))
          .replace(/%/g, '')
          .substring(0, 50) || `review-${Date.now()}`;

        // Check slug exists
        const { data: existing } = await supabase.from('posts').select('id').eq('slug', slug).single();
        if (existing) {
          results.push({ category: cat.slug, keyword, slug, ok: false, error: 'Slug exists' });
          continue;
        }

        // Build fake CoupangSearchResult from DB products
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

        // Generate content via Claude (with template rotation)
        const generated = await generateContent(keyword, slug, fakeResult, cat.slug, usedTemplateIds);
        usedTemplateIds.push(generated.template_id);

        // Build template + disclosure
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

        // Random publish time
        const hours = [7, 10, 14, 19];
        const hour = hours[Math.floor(Math.random() * hours.length)];
        const minute = Math.floor(Math.random() * 50) + 5;
        const pubDate = new Date();
        pubDate.setUTCHours(hour - 9, minute, 0, 0);

        // Insert collection
        const collSlug = `${slug}-top`;
        const { data: collection } = await supabase
          .from('collections')
          .insert({
            slug: collSlug,
            title: `${keyword} TOP ${top5.length}`,
            meta_description: generated.meta_description,
            description: generated.hero_subtitle,
            category_id: cat.id,
            thumbnail_url: top5[0].image_url,
            status: 'published',
            published_at: pubDate.toISOString(),
            faq_json: generated.faq_json,
          })
          .select('id')
          .single();

        // Insert collection_products
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
            category_id: cat.id,
            primary_collection_id: collection?.id ?? null,
            content,
            excerpt: generated.hero_subtitle,
            thumbnail_url: top5[0].image_url,
            status: 'published',
            published_at: pubDate.toISOString(),
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
          results.push({ category: cat.slug, keyword, slug, ok: false, error: postError?.message });
          continue;
        }

        // Insert post_products
        const ppInserts = top5.map((p, i) => ({
          post_id: post.id,
          product_id: p.id,
          display_order: i + 1,
        }));
        await supabase.from('post_products').insert(ppInserts);

        results.push({ category: cat.slug, keyword, slug, ok: true });
      } catch (error) {
        results.push({
          category: cat.slug,
          keyword,
          slug: '',
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return NextResponse.json({
    ok: results.some((r) => r.ok),
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
