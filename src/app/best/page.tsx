import type { Metadata } from 'next';
import { getTopProductsByEvents, getLatestProducts } from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';
import ProductCard from '@/components/ui/product-card';
import AffiliateDisclosure from '@/components/ui/affiliate-disclosure';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '베스트',
  description: '가장 인기 있는 추천 제품 모음 — 클릭 데이터 기반 실시간 인기 순위',
  alternates: { canonical: `${SITE_URL}/best` },
};

export default async function BestPage() {
  // Try events-based ranking first, fall back to latest products
  let products = await getTopProductsByEvents(12);
  const isEventBased = products.length > 0;

  if (!isEventBased) {
    products = await getLatestProducts(12);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">베스트 제품</h1>
      <p className="mt-2 text-gray-500">
        {isEventBased
          ? '많은 분들이 관심 가진 인기 제품'
          : '아직 데이터 수집 중입니다. 최신 등록 제품을 보여드립니다.'}
      </p>

      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} pageSlug="/best" />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-gray-400">아직 등록된 제품이 없습니다.</p>
      )}

      <AffiliateDisclosure />
    </div>
  );
}
