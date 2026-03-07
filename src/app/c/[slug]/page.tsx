import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getCategoryBySlug,
  getPostsByCategory,
  getCollectionsByCategory,
  getAllCategorySlugs,
} from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 600; // ISR: 10분마다 갱신
import Breadcrumb from '@/components/ui/breadcrumb';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllCategorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} 추천`,
    description: category.description ?? `${category.name} 추천 제품과 리뷰`,
    openGraph: {
      title: `${category.name} 추천`,
      description: category.description ?? `${category.name} 추천 제품과 리뷰`,
      type: 'website',
      url: `${SITE_URL}/c/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/c/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [posts, collections] = await Promise.all([
    getPostsByCategory(category.id),
    getCollectionsByCategory(category.id),
  ]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: '홈', href: '/' },
          { label: category.name, href: `/c/${slug}` },
        ]}
      />

      <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-gray-500">{category.description}</p>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">추천 리스트</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {/* Posts */}
      {posts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">관련 글</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-md"
              >
                <p className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}
                {post.published_at && (
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(post.published_at).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && collections.length === 0 && (
        <p className="mt-8 text-center text-gray-400">해당 카테고리에 게시된 콘텐츠가 없습니다.</p>
      )}
    </div>
  );
}
