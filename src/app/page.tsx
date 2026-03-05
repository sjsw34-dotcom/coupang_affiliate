import Link from 'next/link';
import { getPublishedPosts, getPublishedCollections } from '@/lib/queries';
import { SITE_NAME, SITE_URL, CATEGORIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ posts }, collections] = await Promise.all([
    getPublishedPosts(6),
    getPublishedCollections(3),
  ]);

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: '가전, 자동차용품, 캠핑용품 추천 및 비교 리뷰 전문 사이트',
  };

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Hero */}
      <section className="py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          검증된 추천, 현명한 소비
        </h1>
        <p className="mt-3 text-gray-500">
          가전, 자동차용품, 캠핑용품 — 스펙 기반 비교 분석으로 최적의 제품을 찾아드립니다
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/c/${cat.slug}`}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900">추천 리스트</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/l/${col.slug}`}
                className="group rounded-lg border-2 border-orange-200 bg-orange-50 p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase text-orange-600">추천 리스트</p>
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

      {/* Latest Posts */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">최신 글</h2>
            <Link href="/blog" className="text-sm text-blue-600 hover:text-blue-800">
              전체 보기 →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <p className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('ko-KR')
                    : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
