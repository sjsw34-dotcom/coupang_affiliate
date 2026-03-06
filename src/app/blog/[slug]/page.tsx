import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  getPostBySlug,
  getPostProducts,
  getProductsByIds,
  getHubById,
  getCollectionById,
  getCollectionProducts,
  getCategoryById,
  getAllPublishedPostSlugs,
} from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';
import PostMeta from '@/components/ui/post-meta';
import AuthorBox from '@/components/ui/author-box';
import AffiliateDisclosure from '@/components/ui/affiliate-disclosure';
import FAQAccordion from '@/components/ui/faq-accordion';
import ProductCard from '@/components/ui/product-card';
import EditorPickCard from '@/components/ui/editor-pick-card';
import UrgencyBanner from '@/components/ui/urgency-banner';
import SituationPicks from '@/components/ui/situation-picks';
import FinalCtaBanner from '@/components/ui/final-cta-banner';
import MarkdownRenderer from '@/components/blog/markdown-renderer';

interface Props {
  params: Promise<{ slug: string }>;
}

interface TemplateData {
  hero_subtitle?: string;
  urgency?: { title: string; points: string[] };
  situation_picks?: { situation: string; product_name: string; product_index: number }[];
  products_extra?: {
    emotion_summary: string;
    spec_descriptions: string[];
    editor_comment: string;
  }[];
}

function parseTemplateData(content: string): { templateData: TemplateData; cleanContent: string } {
  const match = content.match(/<!--TEMPLATE:([\s\S]*?)-->\n?/);
  if (!match) return { templateData: {}, cleanContent: content };
  try {
    const templateData = JSON.parse(match[1]) as TemplateData;
    const cleanContent = content.replace(match[0], '');
    return { templateData, cleanContent };
  } catch {
    return { templateData: {}, cleanContent: content };
  }
}

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

  const [postProducts, hub, collection, category] = await Promise.all([
    getPostProducts(post.id),
    post.hub_id ? getHubById(post.hub_id) : null,
    post.primary_collection_id ? getCollectionById(post.primary_collection_id) : null,
    getCategoryById(post.category_id),
  ]);

  const productIds = postProducts.map((pp) => pp.product_id);
  const products = await getProductsByIds(productIds);

  // Get collection products for mini_review data
  let collectionMiniReviews: Record<string, string> = {};
  if (collection) {
    const cp = await getCollectionProducts(collection.id);
    collectionMiniReviews = Object.fromEntries(
      cp.filter((c) => c.mini_review).map((c) => [c.product_id, c.mini_review!])
    );
  }

  // Parse template data from content
  const { templateData, cleanContent } = parseTemplateData(post.content);

  // Sort products by display_order
  const sortedProducts = postProducts
    .sort((a, b) => a.display_order - b.display_order)
    .map((pp) => products.find((p) => p.id === pp.product_id))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const topProduct = sortedProducts[0];
  const secondProduct = sortedProducts[1];

  // Hero subtitle from template data or excerpt
  const heroSubtitle = templateData.hero_subtitle || post.excerpt;

  // Breadcrumbs
  const breadcrumbs = [
    { label: '홈', href: '/' },
    ...(category ? [{ label: category.name, href: `/c/${category.slug}` }] : []),
    { label: '블로그', href: '/blog' },
    { label: post.title, href: `/blog/${slug}` },
  ];

  // JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    url: `${SITE_URL}/blog/${slug}`,
    author: { '@type': 'Person', name: post.author_name, description: post.author_bio },
    publisher: { '@type': 'Organization', name: SITE_URL.replace('https://', '') },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
  };

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

  const faqJsonLd = post.faq_json && post.faq_json.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq_json.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null;

  return (
    <article className="mx-auto max-w-3xl">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

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

      {/* Hero Section */}
      <section className="relative mb-8">
        {heroSubtitle && (
          <p className="text-sm text-gray-500 leading-relaxed">{heroSubtitle}</p>
        )}
        <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl leading-tight">
          {post.title}
        </h1>
        <div className="mt-3">
          <PostMeta
            published_at={post.published_at}
            updated_at={post.updated_at}
            reading_time_min={post.reading_time_min}
            author_name={post.author_name}
          />
        </div>
        {/* Hero Image */}
        {post.thumbnail_url && (
          <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-2xl bg-gray-50">
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
      </section>

      {/* 1st CTA — Editor Pick */}
      {topProduct && (
        <EditorPickCard
          product={topProduct}
          emotionSummary={
            templateData.products_extra?.[0]?.emotion_summary
            ?? collectionMiniReviews[topProduct.id]
          }
          editorComment={templateData.products_extra?.[0]?.editor_comment}
          pageSlug={slug}
        />
      )}

      {/* Editorial Content (markdown) */}
      <MarkdownRenderer content={cleanContent} />

      {/* Product Cards — new emotion-first design */}
      {sortedProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">추천 제품 상세</h2>
          <div className="space-y-6">
            {sortedProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                emotionSummary={
                  templateData.products_extra?.[i]?.emotion_summary
                  ?? collectionMiniReviews[product.id]
                }
                specDescriptions={templateData.products_extra?.[i]?.spec_descriptions}
                editorComment={templateData.products_extra?.[i]?.editor_comment}
                pageSlug={slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Situation Picks — 상황별 추천 */}
      {templateData.situation_picks && templateData.situation_picks.length > 0 && (
        <SituationPicks
          picks={templateData.situation_picks}
          products={sortedProducts}
          pageSlug={slug}
        />
      )}

      {/* Urgency Banner */}
      {templateData.urgency && (
        <UrgencyBanner
          title={templateData.urgency.title}
          points={templateData.urgency.points}
        />
      )}

      {/* Final CTA Banner */}
      {topProduct && (
        <FinalCtaBanner
          urgencyTitle={templateData.urgency?.title ?? ''}
          topProduct={topProduct}
          secondProduct={secondProduct}
          pageSlug={slug}
        />
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
