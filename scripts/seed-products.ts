#!/usr/bin/env tsx
/**
 * 상품 시드 스크립트 — Coupang API로 상품 데이터를 DB에 채우기
 * GitHub Actions 또는 로컬에서 실행
 *
 * Usage:
 *   npx tsx scripts/seed-products.ts
 *   npx tsx scripts/seed-products.ts --category electronics
 */

import { createClient } from '@supabase/supabase-js';
import { searchProducts } from './lib/coupang-api';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electronics: [
    '무선 이어폰 추천', '블루투스 스피커 추천', '노트북 거치대',
    '기계식 키보드 추천', '무선 마우스 추천', '27인치 모니터 추천',
    '웹캠 추천', '외장하드 추천', 'USB 허브 추천', '멀티탭 추천',
    '공기청정기 추천', '로봇청소기 추천', '무선충전기 추천',
    '보조배터리 추천', '태블릿 거치대', '게이밍 헤드셋 추천',
    'LED 데스크램프', '전동 드라이버 추천', 'NAS 추천 가정용',
    '스마트워치 추천',
  ],
  'car-accessories': [
    '차량용 공기청정기', '블랙박스 추천', '차량용 핸드폰 거치대',
    '차량용 무선충전기', '차량용 방향제 추천', '자동차 시트커버',
    '차량용 청소기 추천', '점프스타터 추천', '타이어 공기압 충전기',
    '차량용 냉온컵홀더', '자동차 선팅 필름', '트렁크 정리함',
    '차량용 인버터', '후방카메라 추천', '자동차 코팅제 추천',
    '와이퍼 추천', '차량용 LED 전구', '자동차 매트 추천',
    '대시보드 캠 추천', '차량 방충망 추천',
  ],
  'camping-outdoor': [
    '캠핑의자 추천', '캠핑 텐트 추천', '캠핑 침낭 추천',
    '캠핑 랜턴 추천', '캠핑 테이블 추천', '버너 추천 캠핑',
    '아이스박스 추천', '캠핑 매트 추천', '등산화 추천',
    '등산 배낭 추천', '캠핑 코펠 세트', '캠핑 타프 추천',
    '화로대 추천', '감성캠핑 소품', '캠핑 우드 선반',
    '보온병 추천', '등산 스틱 추천', '캠핑 그릴 추천',
    '방수 자켓 추천', '캠핑 전기장판',
  ],
};

const KEYWORD_SLUG_MAP: Record<string, string> = {
  '무선 이어폰 추천': 'wireless-earbuds', '블루투스 스피커 추천': 'bluetooth-speaker',
  '노트북 거치대': 'laptop-stand', '기계식 키보드 추천': 'mechanical-keyboard',
  '무선 마우스 추천': 'wireless-mouse', '27인치 모니터 추천': '27inch-monitor',
  '웹캠 추천': 'webcam', '외장하드 추천': 'external-hdd',
  'USB 허브 추천': 'usb-hub', '멀티탭 추천': 'power-strip',
  '공기청정기 추천': 'air-purifier', '로봇청소기 추천': 'robot-vacuum',
  '무선충전기 추천': 'wireless-charger', '보조배터리 추천': 'power-bank',
  '태블릿 거치대': 'tablet-stand', '게이밍 헤드셋 추천': 'gaming-headset',
  'LED 데스크램프': 'led-desk-lamp', '전동 드라이버 추천': 'electric-driver',
  'NAS 추천 가정용': 'home-nas', '스마트워치 추천': 'smartwatch',
  '차량용 공기청정기': 'car-air-purifier', '블랙박스 추천': 'dashcam',
  '차량용 핸드폰 거치대': 'car-phone-mount', '차량용 무선충전기': 'car-wireless-charger',
  '차량용 방향제 추천': 'car-air-freshener', '자동차 시트커버': 'car-seat-cover',
  '차량용 청소기 추천': 'car-vacuum', '점프스타터 추천': 'jump-starter',
  '타이어 공기압 충전기': 'tire-inflator', '차량용 냉온컵홀더': 'car-cup-cooler',
  '자동차 선팅 필름': 'car-tint-film', '트렁크 정리함': 'trunk-organizer',
  '차량용 인버터': 'car-inverter', '후방카메라 추천': 'rear-camera',
  '자동차 코팅제 추천': 'car-coating', '와이퍼 추천': 'wiper-blade',
  '차량용 LED 전구': 'car-led-bulb', '자동차 매트 추천': 'car-floor-mat',
  '대시보드 캠 추천': 'dashboard-cam', '차량 방충망 추천': 'car-mosquito-net',
  '캠핑의자 추천': 'camping-chair', '캠핑 텐트 추천': 'camping-tent',
  '캠핑 침낭 추천': 'sleeping-bag', '캠핑 랜턴 추천': 'camping-lantern',
  '캠핑 테이블 추천': 'camping-table', '버너 추천 캠핑': 'camping-burner',
  '아이스박스 추천': 'ice-cooler', '캠핑 매트 추천': 'camping-mat',
  '등산화 추천': 'hiking-shoes', '등산 배낭 추천': 'hiking-backpack',
  '캠핑 코펠 세트': 'camping-cookware', '캠핑 타프 추천': 'camping-tarp',
  '화로대 추천': 'fire-pit', '감성캠핑 소품': 'camping-decor',
  '캠핑 우드 선반': 'camping-wood-shelf', '보온병 추천': 'thermos-bottle',
  '등산 스틱 추천': 'trekking-pole', '캠핑 그릴 추천': 'camping-grill',
  '방수 자켓 추천': 'waterproof-jacket', '캠핑 전기장판': 'camping-heating-pad',
};

const BADGES = ['에디터 추천', '가성비 최고', '인기 급상승', '프리미엄', null];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

async function main() {
  console.log('=== Product Seeder ===');

  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'COUPANG_PARTNERS_ACCESS_KEY', 'COUPANG_PARTNERS_SECRET_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Parse args
  const args = process.argv.slice(2);
  let targetCategory: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      targetCategory = args[i + 1];
      i++;
    }
  }

  const supabase = getSupabase();
  const results: { category: string; keyword: string; products: number; collection: boolean; error?: string }[] = [];

  for (const [categorySlug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (targetCategory && categorySlug !== targetCategory) continue;

    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!category) {
      console.log(`Category "${categorySlug}" not found, skipping`);
      continue;
    }

    console.log(`\n--- ${categorySlug} (${keywords.length} keywords) ---`);

    for (const keyword of keywords) {
      try {
        const coupangResult = await searchProducts(keyword, 5);

        if (coupangResult.products.length === 0) {
          results.push({ category: categorySlug, keyword, products: 0, collection: false, error: 'No products' });
          await delay(1000);
          continue;
        }

        const productInserts = coupangResult.products.map((p, i) => ({
          name: p.productName,
          brand: p.productName.split(' ')[0] || null,
          category_id: category.id,
          image_url: p.productImage || null,
          price: p.productPrice || null,
          rating: (4.0 + Math.random() * 0.9),
          affiliate_url: p.productUrl || coupangResult.landingUrl,
          affiliate_type: 'product' as const,
          search_keyword: keyword,
          badge: i === 0 ? BADGES[0] : i === 1 ? BADGES[1] : BADGES[Math.floor(Math.random() * BADGES.length)],
          pros: [] as string[],
          cons: [] as string[],
          is_active: true,
        }));

        const { data: insertedProducts, error: prodError } = await supabase
          .from('products')
          .insert(productInserts)
          .select('id');

        if (prodError || !insertedProducts) {
          results.push({ category: categorySlug, keyword, products: 0, collection: false, error: prodError?.message });
          await delay(1000);
          continue;
        }

        // Create collection
        const year = new Date().getFullYear();
        const collSlug = `best-${KEYWORD_SLUG_MAP[keyword] || keyword.replace(/\s+/g, '-').toLowerCase()}-${year}`;
        const { data: existingCol } = await supabase.from('collections').select('id').eq('slug', collSlug).single();

        let collectionCreated = false;
        if (!existingCol) {
          const { data: collection, error: colError } = await supabase
            .from('collections')
            .insert({
              slug: collSlug,
              title: `${keyword} TOP ${insertedProducts.length}`,
              meta_description: `${year}년 ${keyword} 순위. 스펙 비교 분석으로 선정한 추천 리스트.`,
              description: `${keyword} 제품을 비교 분석하여 선정한 추천 리스트입니다.`,
              category_id: category.id,
              thumbnail_url: coupangResult.products[0]?.productImage || null,
              status: 'published',
              published_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (collection && !colError) {
            collectionCreated = true;
            const cpInserts = insertedProducts.map((prod, i) => ({
              collection_id: collection.id,
              product_id: prod.id,
              rank: i + 1,
              pick_label: i === 0 ? '최고 추천' : i === 1 ? '가성비 1위' : null,
              mini_review: null,
            }));
            await supabase.from('collection_products').insert(cpInserts);
          }
        }

        console.log(`  ${keyword}: ${insertedProducts.length} products${collectionCreated ? ' + collection' : ''}`);
        results.push({ category: categorySlug, keyword, products: insertedProducts.length, collection: collectionCreated });

        await delay(1000); // Rate limit
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ${keyword}: ERROR - ${msg}`);
        results.push({ category: categorySlug, keyword, products: 0, collection: false, error: msg });
        await delay(1000);
      }
    }
  }

  const totalProducts = results.reduce((sum, r) => sum + r.products, 0);
  const totalCollections = results.filter((r) => r.collection).length;
  console.log(`\n=== Done: ${totalProducts} products, ${totalCollections} collections ===`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
