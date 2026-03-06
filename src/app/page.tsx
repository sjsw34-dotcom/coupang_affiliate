import Link from 'next/link';
import Image from 'next/image';
import {
  getPublishedPosts,
  getCategories,
  getCollectionsWithStatsByCategory,
} from '@/lib/queries';
import type { CollectionWithStats } from '@/lib/queries';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import type { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  electronics: { icon: '💻', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  'car-accessories': { icon: '🚗', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'camping-outdoor': { icon: '⛺', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

function formatPrice(price: number): string {
  if (price >= 10000) {
    const man = Math.floor(price / 10000);
    const rest = Math.floor((price % 10000) / 1000);
    return rest > 0 ? `${man}.${rest}만` : `${man}만`;
  }
  return `${price.toLocaleString()}`;
}

function priceRange(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${formatPrice(min)}~${formatPrice(max)}원대`;
  if (min) return `${formatPrice(min)}원~`;
  return null;
}

export default async function Home() {
  const categories = await getCategories();

  const [collectionsMap, { posts }] = await Promise.all([
    Promise.all(
      categories.map(async (cat) => ({
        category: cat,
        collections: await getCollectionsWithStatsByCategory(cat.id, 12),
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
    <div className="space-y-10 pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Hero + Category Quick Links */}
      <section className="pt-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          검증된 추천, 현명한 소비
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          스펙 비교 분석으로 최적의 제품을 찾아드립니다
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug];
            return (
              <a
                key={cat.slug}
                href={`#cat-${cat.slug}`}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${meta?.border || 'border-gray-200'} ${meta?.bg || 'bg-gray-50'} ${meta?.color || 'text-gray-700'} hover:shadow-sm`}
              >
                <span>{meta?.icon}</span>
                {cat.name}
              </a>
            );
          })}
        </div>
      </section>

      {/* Category Sections */}
      {collectionsMap.map(({ category, collections }, idx) => (
        <CategorySection
          key={category.id}
          category={category}
          collections={collections}
          isFirst={idx === 0}
        />
      ))}

      {/* Latest Reviews */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">최신 리뷰</h2>
            <Link href="/blog" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              전체 보기 →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                {post.thumbnail_url && (
                  <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={post.thumbnail_url}
                      alt={post.title}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-blue-600">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-1">{post.excerpt}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-300">
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

/* ─── Category Section with Horizontal Scroll ─── */

function CategorySection({
  category,
  collections,
  isFirst,
}: {
  category: Category;
  collections: CollectionWithStats[];
  isFirst: boolean;
}) {
  if (collections.length === 0) return null;

  const meta = CATEGORY_META[category.slug] || { icon: '📦', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  const [featured, ...rest] = collections;

  return (
    <section id={`cat-${category.slug}`} className="scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
        </div>
        <Link
          href={`/c/${category.slug}`}
          className="text-sm font-medium text-gray-400 hover:text-gray-700"
        >
          전체 보기 →
        </Link>
      </div>

      {/* Featured Card (first collection, larger) */}
      <Link
        href={`/l/${featured.slug}`}
        className={`group mt-3 flex overflow-hidden rounded-2xl border-2 ${meta.border} ${meta.bg} transition-shadow hover:shadow-lg`}
      >
        <div className="relative hidden h-auto w-[200px] flex-shrink-0 sm:block">
          {featured.thumbnail_url ? (
            <Image
              src={featured.thumbnail_url}
              alt={featured.title}
              fill
              sizes="200px"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl opacity-30">
              {meta.icon}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
          <span className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>
            PICK
          </span>
          <p className="mt-1 text-base font-bold text-gray-900 group-hover:text-gray-700 sm:text-lg">
            {featured.title}
          </p>
          {featured.meta_description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {featured.meta_description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            {featured.product_count > 0 && (
              <span className="text-xs text-gray-400">{featured.product_count}개 제품 비교</span>
            )}
            {priceRange(featured.min_price, featured.max_price) && (
              <span className="text-xs font-semibold text-orange-500">
                {priceRange(featured.min_price, featured.max_price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Horizontal Scroll Cards */}
      {rest.length > 0 && (
        <div className="relative mt-3">
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory md:mx-0 md:px-0">
            {rest.map((col, i) => (
              <CollectionCard key={col.id} collection={col} meta={meta} rank={i + 2} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Collection Card (horizontal scroll item) ─── */

function CollectionCard({
  collection,
  meta,
  rank,
}: {
  collection: CollectionWithStats;
  meta: { icon: string; color: string; bg: string; border: string };
  rank: number;
}) {
  const price = priceRange(collection.min_price, collection.max_price);

  return (
    <Link
      href={`/l/${collection.slug}`}
      className="group flex w-[160px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md sm:w-[180px]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-50">
        {collection.thumbnail_url ? (
          <Image
            src={collection.thumbnail_url}
            alt={collection.title}
            fill
            sizes="180px"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl opacity-20">
            {meta.icon}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-[13px] font-semibold leading-tight text-gray-800 line-clamp-2 group-hover:text-gray-600">
          {collection.title}
        </p>
        <div className="mt-auto pt-2">
          {price && (
            <p className="text-xs font-bold text-orange-500">{price}</p>
          )}
          {collection.product_count > 0 && (
            <p className="text-[11px] text-gray-400">{collection.product_count}개 제품</p>
          )}
        </div>
      </div>
    </Link>
  );
}
