import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { searchProducts } from '@/lib/coupang-api';
import { generateContent, getRecentTemplateIds } from '@/lib/content-generator';
import { getServiceClient } from '@/lib/supabase';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  return token === secret;
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { keyword, category_id } = await req.json();

    if (!keyword || !category_id) {
      return NextResponse.json(
        { error: '키워드와 카테고리를 입력해주세요.' },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();

    // Get category slug from id
    const { data: category } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('id', category_id)
      .single();

    if (!category) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 400 });
    }

    // Search Coupang products
    let coupangResult;
    try {
      coupangResult = await searchProducts(keyword, 5);
      if (coupangResult.products.length === 0) {
        throw new Error('No products');
      }
    } catch {
      // Fallback: try with existing DB products
      const { data: dbProducts } = await supabase
        .from('products')
        .select('id, name, price, image_url, affiliate_url, search_keyword')
        .eq('category_id', category_id)
        .eq('is_active', true)
        .limit(5);

      if (!dbProducts || dbProducts.length === 0) {
        return NextResponse.json(
          { error: '쿠팡 검색 결과가 없고, DB에도 해당 카테고리 상품이 없습니다.' },
          { status: 404 },
        );
      }

      coupangResult = {
        landingUrl: dbProducts[0].affiliate_url,
        products: dbProducts.map((p, i) => ({
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
    }

    // Generate slug from keyword
    const slug = keyword
      .replace(/[^\w\s가-힣a-zA-Z0-9-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[가-힣]+/g, (m: string) => encodeURIComponent(m))
      .replace(/%/g, '')
      .substring(0, 60) || `review-${Date.now()}`;

    // Generate content with Claude
    const recentTemplateIds = await getRecentTemplateIds(5);
    const generated = await generateContent(
      keyword,
      slug,
      coupangResult,
      category.slug,
      recentTemplateIds,
    );

    // Return all fields for the editor to fill in (don't save to DB yet)
    return NextResponse.json({
      title: generated.title,
      slug: generated.slug,
      content: generated.content,
      meta_description: generated.meta_description,
      excerpt: generated.hero_subtitle,
      primary_keyword: generated.primary_keyword,
      secondary_keywords: generated.secondary_keywords,
      faq_json: generated.faq_json,
      // Extra data for reference
      products: generated.products,
      urgency: generated.urgency,
      situation_picks: generated.situation_picks,
      hero_subtitle: generated.hero_subtitle,
      template_id: generated.template_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
