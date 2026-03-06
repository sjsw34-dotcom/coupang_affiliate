import Link from 'next/link';
import Image from 'next/image';
import {
  getPublishedPosts,
  getCategories,
  getPostsByCategory,
} from '@/lib/queries';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import type { Category, Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORY_META: Record<string, { icon: string; accent: string; tag: string }> = {
  electronics: { icon: '💻', accent: 'text-blue-600', tag: 'bg-blue-50 text-blue-700' },
  'car-accessories': { icon: '🚗', accent: 'text-emerald-600', tag: 'bg-emerald-50 text-emerald-700' },
  'camping-outdoor': { icon: '⛺', accent: 'text-amber-600', tag: 'bg-amber-50 text-amber-700' },
};

export default async function Home() {
  const categories = await getCategories();

  const [categoryPosts, { posts: latestPosts }] = await Promise.all([
    Promise.all(
      categories.map(async (cat) => ({
        category: cat,
        posts: await getPostsByCategory(cat.id, 4),
      }))
    ),
    getPublishedPosts(3),
  ]);

  // Use first post as featured hero
  const allPosts = categoryPosts.flatMap((cp) => cp.posts);
  const featured = allPosts[0] ?? latestPosts[0];
  const featuredCategory = featured
    ? categories.find((c) => c.id === featured.category_id)
    : null;

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: '가전, 자동차용품, 캠핑용품 전문 리뷰 매거진',
  };

  return (
    <div className="pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* ── Hero: Featured Article ── */}
      {featured && (
        <section className="-mx-4 -mt-6 mb-10">
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative block overflow-hidden bg-gray-900"
          >
            {/* Background Image */}
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
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

            {/* Content */}
            <div className="relative mx-auto max-w-3xl px-6 pb-10 pt-32 text-center md:pb-14 md:pt-44">
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
                <span>
                  {featured.published_at
                    ? new Date(featured.published_at).toLocaleDateString('ko-KR')
                    : ''}
                </span>
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
      )}

      <div className="space-y-12">
        {/* ── Category Sections: Editorial Grid ── */}
        {categoryPosts.map(({ category, posts }) => (
          <CategoryEditorial key={category.id} category={category} posts={posts} />
        ))}

        {/* ── 전체 최신 리뷰 ── */}
        {latestPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-bold text-gray-900">최신 리뷰</h2>
              <Link href="/blog" className="text-sm font-medium text-gray-400 hover:text-gray-700">
                전체 보기 →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              {latestPosts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─── Category Editorial Section ─── */

function CategoryEditorial({
  category,
  posts,
}: {
  category: Category;
  posts: Post[];
}) {
  if (posts.length === 0) return null;

  const meta = CATEGORY_META[category.slug] || { icon: '📦', accent: 'text-gray-600', tag: 'bg-gray-100 text-gray-700' };
  const [lead, ...rest] = posts;

  return (
    <section>
      {/* Section Header */}
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

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Lead Article — large */}
        <div className="md:col-span-7">
          <Link href={`/blog/${lead.slug}`} className="group block">
            {lead.thumbnail_url && (
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={lead.thumbnail_url}
                  alt={lead.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="mt-3">
              <span className={`text-xs font-semibold ${meta.accent}`}>
                {category.name}
              </span>
              <h3 className="mt-1 text-xl font-bold leading-snug text-gray-900 group-hover:text-gray-600">
                {lead.title}
              </h3>
              {lead.excerpt && (
                <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
                  {lead.excerpt}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {lead.author_name} · {lead.published_at ? new Date(lead.published_at).toLocaleDateString('ko-KR') : ''}
              </p>
            </div>
          </Link>
        </div>

        {/* Side Articles — stacked list */}
        <div className="flex flex-col gap-4 md:col-span-5">
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex gap-4 border-b border-gray-100 pb-4 last:border-0"
            >
              {post.thumbnail_url && (
                <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col justify-center">
                <h4 className="text-sm font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-gray-600">
                  {post.title}
                </h4>
                <p className="mt-1 text-xs text-gray-400">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
                  {post.reading_time_min ? ` · ${post.reading_time_min}분` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Reusable Article Card ─── */

function ArticleCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      {post.thumbnail_url && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <h3 className="mt-3 text-sm font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-gray-600">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
      )}
      <p className="mt-2 text-xs text-gray-400">
        {post.author_name} · {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
      </p>
    </Link>
  );
}
