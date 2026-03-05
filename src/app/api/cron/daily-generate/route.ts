import { NextRequest, NextResponse } from 'next/server';
import { generateKeywords } from '@/lib/keyword-generator';
import { searchProducts } from '@/lib/coupang-api';
import { generateContent } from '@/lib/content-generator';
import { getServiceClient } from '@/lib/supabase';

const CATEGORIES = ['electronics', 'car-accessories', 'camping-outdoor'] as const;

// Rotation: each cron run picks one category based on the current 6-hour slot
// 00:00 → slot 0, 06:00 → slot 1, 12:00 → slot 2, 18:00 → slot 3
// Categories rotate: elec, car, camping, elec, car, camping, ...
function getCategoryForSlot(): (typeof CATEGORIES)[number] {
  const now = new Date();
  const hour = now.getUTCHours();
  const slot = Math.floor(hour / 6); // 0, 1, 2, 3
  return CATEGORIES[slot % CATEGORIES.length];
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const secret = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();
    const categorySlug = getCategoryForSlot();

    // 1. Generate keyword for this category
    const keywords = await generateKeywords(categorySlug, 1);
    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'No new keywords generated', category: categorySlug },
        { status: 200 }
      );
    }

    const { keyword, slug } = keywords[0];

    // 2. Check slug doesn't exist
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${slug}" already exists`, category: categorySlug },
        { status: 200 }
      );
    }

    // 3. Get category ID
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 500 });
    }

    // 4. Search Coupang
    const coupangResult = await searchProducts(keyword, 5);
    if (coupangResult.products.length === 0) {
      // Log job as failed
      await supabase.from('daily_jobs').insert({
        job_type: 'post_generate',
        status: 'failed',
        result_json: { keyword, slug, category: categorySlug, error: 'No products found' },
      });
      return NextResponse.json({ error: 'No products found', keyword }, { status: 200 });
    }

    // 5. Generate content
    const generated = await generateContent(keyword, slug, coupangResult);

    // 6. Insert products
    const firstProductImage = coupangResult.products[0]?.productImage ?? null;
    const productInserts = generated.products.map((p, i) => ({
      name: p.name,
      brand: p.brand,
      category_id: category.id,
      image_url: coupangResult.products[i]?.productImage ?? null,
      price: p.price,
      affiliate_url: coupangResult.products[i]?.productUrl ?? coupangResult.landingUrl,
      affiliate_type: 'search' as const,
      search_keyword: keyword,
      badge: i === 0 ? '최고 추천' : i === 1 ? '가성비 추천' : null,
      pros: p.pros,
      cons: p.cons,
      is_active: true,
    }));

    const { data: insertedProducts, error: prodError } = await supabase
      .from('products')
      .insert(productInserts)
      .select('id');

    if (prodError || !insertedProducts) {
      await supabase.from('daily_jobs').insert({
        job_type: 'post_generate',
        status: 'failed',
        result_json: { keyword, slug, error: prodError?.message },
      });
      return NextResponse.json({ error: 'Failed to insert products' }, { status: 500 });
    }

    // 7. Insert collection
    const collectionSlug = `${slug}-top`;
    const { data: collection, error: colError } = await supabase
      .from('collections')
      .insert({
        slug: collectionSlug,
        title: `${keyword} TOP ${generated.products.length}`,
        meta_description: generated.meta_description,
        description: generated.excerpt,
        category_id: category.id,
        thumbnail_url: firstProductImage,
        status: 'published',
        published_at: new Date().toISOString(),
        faq_json: generated.faq_json,
      })
      .select('id')
      .single();

    if (colError || !collection) {
      return NextResponse.json({ error: 'Failed to insert collection' }, { status: 500 });
    }

    // 8. Insert collection_products
    const cpInserts = insertedProducts.map((prod, i) => ({
      collection_id: collection.id,
      product_id: prod.id,
      rank: generated.products[i]?.rank ?? i + 1,
      pick_label: generated.products[i]?.pick_label ?? null,
      mini_review: generated.products[i]?.mini_review ?? null,
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
        content: generated.content,
        excerpt: generated.excerpt,
        thumbnail_url: firstProductImage,
        status: 'published',
        published_at: new Date().toISOString(),
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
      return NextResponse.json({ error: 'Failed to insert post' }, { status: 500 });
    }

    // 10. Insert post_products
    const ppInserts = insertedProducts.map((prod, i) => ({
      post_id: post.id,
      product_id: prod.id,
      display_order: i + 1,
    }));
    await supabase.from('post_products').insert(ppInserts);

    // 11. Log success
    await supabase.from('daily_jobs').insert({
      job_type: 'post_generate',
      status: 'done',
      result_json: {
        keyword,
        slug,
        category: categorySlug,
        products_count: insertedProducts.length,
        post_url: `/blog/${slug}`,
        collection_url: `/l/${collectionSlug}`,
      },
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      keyword,
      slug,
      category: categorySlug,
      products_count: insertedProducts.length,
      urls: {
        post: `/blog/${slug}`,
        collection: `/l/${collectionSlug}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
