import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  getPostBySlug,
  getPostProducts,
  getProductsByIds,
  getHubById,
  getCollectionById,
  getCategoryById,
  getAllPublishedPostSlugs,
} from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';
import Breadcrumb from '@/components/ui/breadcrumb';
import PostMeta from '@/components/ui/post-meta';
import AuthorBox from '@/components/ui/author-box';
import AffiliateDisclosure from '@/components/ui/affiliate-disclosure';
import HubCard from '@/components/ui/hub-card';
import CollectionCTACard from '@/components/ui/collection-cta-card';
import FAQAccordion from '@/components/ui/faq-accordion';
import ProductCard from '@/components/ui/product-card';
import MarkdownRenderer from '@/components/blog/markdown-renderer';

interface Props {
  params: Promise<{ slug: string }>;
}

// SSG: pre-render all published post slugs at build time
// Falls back to on-demand rendering if Supabase is unavailable (dynamicParams defaults to true)
export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description ?? undefined,
      type: 'article',
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: [post.author_name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description ?? undefined,
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Fetch related data in parallel
  const [postProducts, hub, collection, category] = await Promise.all([
    getPostProducts(post.id),
    post.hub_id ? getHubById(post.hub_id) : null,
    post.primary_collection_id ? getCollectionById(post.primary_collection_id) : null,
    getCategoryById(post.category_id),
  ]);

  const productIds = postProducts.map((pp) => pp.product_id);
  const products = await getProductsByIds(productIds);

  // Breadcrumbs
  const breadcrumbs = [
    { label: '홈', href: '/' },
    ...(category ? [{ label: category.name, href: `/c/${category.slug}` }] : []),
    { label: '블로그', href: '/blog' },
    { label: post.title, href: `/blog/${slug}` },
  ];

  // JSON-LD: Article
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    url: `${SITE_URL}/blog/${slug}`,
    author: {
      '@type': 'Person',
      name: post.author_name,
      description: post.author_bio,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_URL.replace('https://', ''),
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
  };

  // JSON-LD: FAQPage (if faq exists)
  const faqJsonLd = post.faq_json && post.faq_json.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq_json.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

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

  // JSON-LD: Person (author)
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: post.author_name,
    description: post.author_bio,
    image: post.author_image_url,
  };

  return (
    <article className="mx-auto max-w-3xl">
      {/* JSON-LD scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Breadcrumb (visual, without duplicate JSON-LD) */}
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {breadcrumbs.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-gray-900">{item.label}</span>
              ) : (
                <a href={item.href} className="hover:text-gray-900">
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{post.title}</h1>

      {/* Thumbnail */}
      {post.thumbnail_url && (
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg bg-gray-50">
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
            priority
          />
        </div>
      )}

      {/* Post Meta */}
      <div className="mt-3">
        <PostMeta
          published_at={post.published_at}
          updated_at={post.updated_at}
          reading_time_min={post.reading_time_min}
          author_name={post.author_name}
        />
      </div>

      {/* Markdown Content with auto-injected HubCard and CollectionCTACard */}
      <MarkdownRenderer
        content={post.content}
        hubCard={hub ? <HubCard hub={hub} /> : undefined}
        collectionCard={collection ? <CollectionCTACard collection={collection} /> : undefined}
      />

      {/* Related Products */}
      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">관련 제품</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} pageSlug={slug} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {post.faq_json && post.faq_json.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">자주 묻는 질문</h2>
          <FAQAccordion items={post.faq_json} />
        </section>
      )}

      {/* Author Box */}
      <AuthorBox
        author_name={post.author_name}
        author_bio={post.author_bio}
        author_image_url={post.author_image_url}
      />

      {/* Affiliate Disclosure */}
      <AffiliateDisclosure />
    </article>
  );
}
