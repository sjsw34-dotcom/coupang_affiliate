import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchProducts } from '@/lib/coupang-api';
import { generateContent } from '@/lib/content-generator';
import { getServiceClient } from '@/lib/supabase';

const requestSchema = z.object({
  keyword: z.string().min(2),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  category_slug: z.enum(['electronics', 'car-accessories', 'camping-outdoor']),
});

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const secret = req.headers.get('x-admin-secret');
    if (secret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { keyword, slug, category_slug } = parsed.data;
    const supabase = getServiceClient();

    // 1. Check for duplicate slug
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `Post with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // 2. Get category ID
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category_slug)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // 3. Search Coupang
    const coupangResult = await searchProducts(keyword, 5);

    if (coupangResult.products.length === 0) {
      return NextResponse.json({ error: 'No products found on Coupang' }, { status: 404 });
    }

    // 4. Generate content with Claude
    const generated = await generateContent(keyword, slug, coupangResult);

    // 5. Insert products
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
      return NextResponse.json(
        { error: 'Failed to insert products', details: prodError?.message },
        { status: 500 }
      );
    }

    // 6. Insert collection
    const collectionSlug = `${slug}-top`;
    const { data: collection, error: colError } = await supabase
      .from('collections')
      .insert({
        slug: collectionSlug,
        title: `${keyword} TOP ${generated.products.length}`,
        meta_description: generated.meta_description,
        description: generated.excerpt,
        category_id: category.id,
        status: 'published',
        published_at: new Date().toISOString(),
        faq_json: generated.faq_json,
      })
      .select('id')
      .single();

    if (colError || !collection) {
      return NextResponse.json(
        { error: 'Failed to insert collection', details: colError?.message },
        { status: 500 }
      );
    }

    // 7. Insert collection_products
    const collectionProductInserts = insertedProducts.map((prod, i) => ({
      collection_id: collection.id,
      product_id: prod.id,
      rank: generated.products[i]?.rank ?? i + 1,
      pick_label: generated.products[i]?.pick_label ?? null,
      mini_review: generated.products[i]?.mini_review ?? null,
    }));

    await supabase.from('collection_products').insert(collectionProductInserts);

    // 8. Insert post
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
      return NextResponse.json(
        { error: 'Failed to insert post', details: postError?.message },
        { status: 500 }
      );
    }

    // 9. Insert post_products
    const postProductInserts = insertedProducts.map((prod, i) => ({
      post_id: post.id,
      product_id: prod.id,
      display_order: i + 1,
    }));

    await supabase.from('post_products').insert(postProductInserts);

    return NextResponse.json({
      ok: true,
      post_slug: slug,
      collection_slug: collectionSlug,
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
