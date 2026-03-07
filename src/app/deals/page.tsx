import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedCollections, getLatestProducts } from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';
import ProductCard from '@/components/ui/product-card';
import AffiliateDisclosure from '@/components/ui/affiliate-disclosure';

export const revalidate = 600; // ISR: 10분마다 갱신

export const metadata: Metadata = {
  title: '할인/특가',
  description: '에디터가 엄선한 할인 제품과 특가 정보 — 최저가 비교 및 추천',
  alternates: { canonical: `${SITE_URL}/deals` },
};

export default async function DealsPage() {
  const [collections, products] = await Promise.all([
    getPublishedCollections(4),
    getLatestProducts(6),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">할인/특가</h1>
      <p className="mt-2 text-gray-500">에디터가 엄선한 추천 제품과 특가 정보</p>

      {/* Editor's Pick Collections */}
      {collections.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">에디터 추천 리스트</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/l/${col.slug}`}
                className="group rounded-lg border-2 border-orange-200 bg-orange-50 p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase text-orange-600">에디터 추천</p>
                <p className="mt-1 text-lg font-bold text-gray-900 group-hover:text-orange-700">
                  {col.title}
                </p>
                {col.meta_description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {col.meta_description}
                  </p>
                )}
                <span className="mt-3 inline-block text-sm font-medium text-orange-600">
                  리스트 보기 →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">최근 등록 제품</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} pageSlug="/deals" />
            ))}
          </div>
        </section>
      )}

      {collections.length === 0 && products.length === 0 && (
        <p className="mt-8 text-center text-gray-400">현재 진행 중인 특가가 없습니다.</p>
      )}

      <AffiliateDisclosure />
    </div>
  );
}
