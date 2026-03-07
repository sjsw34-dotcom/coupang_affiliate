import Link from 'next/link';
import Image from 'next/image';
import {
  getPublishedPosts,
  getCategories,
  getPostsByCategory,
  getCollectionsByCategory,
} from '@/lib/queries';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import type { Category, Post, Collection } from '@/lib/types';

export const revalidate = 600; // ISR: 10분마다 갱신

const CATEGORY_META: Record<string, { icon: string; accent: string; tag: string }> = {
  electronics: { icon: '💻', accent: 'text-blue-600', tag: 'bg-blue-50 text-blue-700' },
  'car-accessories': { icon: '🚗', accent: 'text-emerald-600', tag: 'bg-emerald-50 text-emerald-700' },
  'camping-outdoor': { icon: '⛺', accent: 'text-amber-600', tag: 'bg-amber-50 text-amber-700' },
};

export default async function Home() {
  const categories = await getCategories();

  const [categoryData, { posts: latestPosts }] = await Promise.all([
    Promise.all(
      categories.map(async (cat) => {
        const [posts, collections] = await Promise.all([
          getPostsByCategory(cat.id, 8),
          getCollectionsByCategory(cat.id, 6),
        ]);
        return { category: cat, posts, collections };
      })
    ),
    getPublishedPosts(1),
  ]);

  // Featured = latest post across all categories
  const allPosts = categoryData.flatMap((d) => d.posts);
  const featured = allPosts[0] ?? null;
  const featuredId = featured?.id;
  const featuredCategory = featured
    ? categories.find((c) => c.id === featured.category_id)
    : null;

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: '가전, 자동차용품, 캠핑장비 추천 비교 사이트 — 스펙 비교, 실사용 리뷰, 최저가 정보까지 한눈에',
  };

  return (
    <div className="pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* ── Hero: Featured Article ── */}
      {featured ? (
        <section className="-mx-4 -mt-6 mb-10">
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative block overflow-hidden bg-gray-900"
          >
            {featured.thumbnail_url && (
              <div className="absolute inset-0">
                <Image
                  src={featured.thumbnail_url}
                  alt={featured.title}
                  fill
                  sizes="100vw"
                  className="object-cover opacity-40 transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
            <div className="relative mx-auto max-w-3xl px-6 pb-10 pt-28 text-center md:pb-14 md:pt-40">
              {featuredCategory && (
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_META[featuredCategory.slug]?.tag || 'bg-gray-100 text-gray-700'}`}>
                  {featuredCategory.name}
                </span>
              )}
              <h1 className="mt-3 text-2xl font-extrabold leading-tight text-white md:text-4xl">
                {featured.title}
              </h1>
              {featured.excerpt && (
                <p className="mt-3 text-sm leading-relaxed text-gray-300 line-clamp-2 md:text-base">
                  {featured.excerpt}
                </p>
              )}
              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-400">
                <span>{featured.author_name}</span>
                <span>·</span>
                <span>{featured.published_at ? new Date(featured.published_at).toLocaleDateString('ko-KR') : ''}</span>
                {featured.reading_time_min && (
                  <>
                    <span>·</span>
                    <span>{featured.reading_time_min}분 읽기</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        </section>
      ) : (
        /* No posts yet — show intro */
        <section className="-mx-4 -mt-6 mb-10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-6 pb-10 pt-12 text-center md:pb-14 md:pt-16">
          <h1 className="text-2xl font-extrabold text-white md:text-4xl">
            비교하고 고르는 스마트한 소비
          </h1>
          <p className="mt-3 text-sm text-blue-200/80 md:text-base">
            가전, 자동차용품, 캠핑장비 — 전문 에디터의 리뷰와 추천 가이드
          </p>
          <div className="mx-auto mt-6 flex max-w-md justify-center gap-3">
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat.slug];
              return (
                <Link
                  key={cat.slug}
                  href={`/c/${cat.slug}`}
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-4 py-3 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <span className="text-2xl">{meta?.icon}</span>
                  <span className="text-xs font-medium">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="space-y-12">
        {/* ── Category Sections ── */}
        {categoryData.map(({ category, posts, collections }) => (
          <CategorySection
            key={category.id}
            category={category}
            posts={posts.filter((p) => p.id !== featuredId)}
            collections={collections}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Category Section: Posts + Collections mixed ─── */

function CategorySection({
  category,
  posts,
  collections,
}: {
  category: Category;
  posts: Post[];
  collections: Collection[];
}) {
  // Skip if nothing to show
  if (posts.length === 0 && collections.length === 0) return null;

  const meta = CATEGORY_META[category.slug] || { icon: '📦', accent: 'text-gray-600', tag: 'bg-gray-100 text-gray-700' };

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
        </div>
        <Link
          href={`/c/${category.slug}`}
          className="text-sm font-medium text-gray-400 hover:text-gray-700"
        >
          전체 보기 →
        </Link>
      </div>

      {/* Posts (if any) */}
      {posts.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
                {post.thumbnail_url ? (
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl opacity-20">
                    {meta.icon}
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-gray-600">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-1 hidden text-xs text-gray-500 line-clamp-2 sm:block">{post.excerpt}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Collections as Guide Cards */}
      {collections.length > 0 && (
        <div className={posts.length > 0 ? 'mt-6' : 'mt-4'}>
          {posts.length > 0 && (
            <h3 className="mb-3 text-sm font-semibold text-gray-500">추천 가이드</h3>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/l/${col.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-gray-50">
                  {col.thumbnail_url ? (
                    <Image
                      src={col.thumbnail_url}
                      alt={col.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl opacity-20">
                      {meta.icon}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold leading-tight text-gray-800 line-clamp-2 group-hover:text-gray-600">
                    {col.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
