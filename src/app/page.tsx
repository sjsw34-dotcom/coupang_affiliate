import Link from 'next/link';
import Image from 'next/image';
import {
  getPublishedPosts,
  getCategories,
  getCollectionsByCategory,
} from '@/lib/queries';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import type { Category, Collection } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '💻',
  'car-accessories': '🚗',
  'camping-outdoor': '⛺',
};

export default async function Home() {
  const categories = await getCategories();

  // Fetch collections per category + latest posts in parallel
  const [collectionsMap, { posts }] = await Promise.all([
    Promise.all(
      categories.map(async (cat) => ({
        category: cat,
        collections: await getCollectionsByCategory(cat.id, 10),
      }))
    ),
    getPublishedPosts(6),
  ]);

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: '가전, 자동차용품, 캠핑용품 추천 및 비교 리뷰 전문 사이트',
  };

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Hero — compact */}
      <section className="pb-2 pt-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          검증된 추천, 현명한 소비
        </h1>
        <p className="mt-2 text-sm text-gray-500 md:text-base">
          스펙 비교 분석으로 최적의 제품을 찾아드립니다
        </p>
      </section>

      {/* Category Sections */}
      {collectionsMap.map(({ category, collections }) => (
        <CategorySection
          key={category.id}
          category={category}
          collections={collections}
        />
      ))}

      {/* Latest Posts */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">최신 리뷰</h2>
            <Link
              href="/blog"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex gap-3 rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md"
              >
                {post.thumbnail_url && (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={post.thumbnail_url}
                      alt={post.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('ko-KR')
                      : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CategorySection({
  category,
  collections,
}: {
  category: Category;
  collections: Collection[];
}) {
  if (collections.length === 0) return null;

  const icon = CATEGORY_ICONS[category.slug] || '📦';

  return (
    <section>
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {collections.length}
          </span>
        </div>
        <Link
          href={`/c/${category.slug}`}
          className="text-sm text-gray-500 hover:text-orange-600"
        >
          전체 보기 →
        </Link>
      </div>

      {/* Collection Grid — compact cards */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/l/${col.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-orange-300 hover:shadow-md"
          >
            {/* Compact square thumbnail */}
            <div className="relative aspect-square bg-gray-50">
              {col.thumbnail_url ? (
                <Image
                  src={col.thumbnail_url}
                  alt={col.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl text-gray-300">
                  {icon}
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex flex-1 flex-col justify-between p-2.5">
              <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-orange-600">
                {col.title}
              </p>
              <span className="mt-1.5 text-[10px] font-medium text-orange-500">
                추천 보기 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
