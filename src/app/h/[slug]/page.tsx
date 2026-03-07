import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
export const revalidate = 600; // ISR: 10분마다 갱신

import {
  getHubBySlug,
  getHubLinks,
  getPostsByHub,
  getCollectionById,
  getCategoryById,
  getAllPublishedHubSlugs,
} from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedHubSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getHubBySlug(slug);
  if (!hub) return {};

  return {
    title: hub.title,
    description: hub.meta_description,
    openGraph: {
      title: hub.title,
      description: hub.meta_description ?? undefined,
      type: 'website',
      url: `${SITE_URL}/h/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/h/${slug}` },
  };
}

export default async function HubPage({ params }: Props) {
  const { slug } = await params;
  const hub = await getHubBySlug(slug);
  if (!hub) notFound();

  const [hubLinks, posts, category] = await Promise.all([
    getHubLinks(hub.id),
    getPostsByHub(hub.id),
    getCategoryById(hub.category_id),
  ]);

  // Fetch collection details for collection-type links
  const collectionLinks = hubLinks.filter((l) => l.target_type === 'collection');
  const collections = (
    await Promise.all(collectionLinks.map((l) => getCollectionById(l.target_id)))
  ).filter(Boolean);

  // Breadcrumbs
  const breadcrumbs = [
    { label: '홈', href: '/' },
    ...(category ? [{ label: category.name, href: `/c/${category.slug}` }] : []),
    { label: hub.title, href: `/h/${slug}` },
  ];

  // JSON-LD: CollectionPage
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.title,
    description: hub.meta_description,
    url: `${SITE_URL}/h/${slug}`,
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {breadcrumbs.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-gray-900">{item.label}</span>
              ) : (
                <a href={item.href} className="hover:text-gray-900">{item.label}</a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{hub.title}</h1>
      {hub.meta_description && (
        <p className="mt-2 text-lg text-gray-500">{hub.meta_description}</p>
      )}
      {hub.description && (
        <p className="mt-3 text-gray-600 leading-relaxed">{hub.description}</p>
      )}

      {/* Section 1: Related Collections (2~4개) */}
      {collections.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">추천 리스트</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col!.id}
                href={`/l/${col!.slug}`}
                className="group rounded-lg border-2 border-orange-200 bg-orange-50 p-5 transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase text-orange-600">추천 리스트</p>
                <p className="mt-1 text-lg font-bold text-gray-900 group-hover:text-orange-700">
                  {col!.title}
                </p>
                {col!.meta_description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {col!.meta_description}
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

      {/* Section 2: Related Posts Grid (최대 12개) */}
      {posts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">관련 글</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  {post.thumbnail_url ? (
                    <Image
                      src={post.thumbnail_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      리뷰
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{post.author_name}</span>
                    {post.published_at && (
                      <>
                        <span>·</span>
                        <span>{new Date(post.published_at).toLocaleDateString('ko-KR')}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
