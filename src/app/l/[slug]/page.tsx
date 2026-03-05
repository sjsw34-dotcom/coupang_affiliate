import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  getCollectionBySlug,
  getCollectionProducts,
  getProductsByIds,
  getCategoryById,
  getAllPublishedCollectionSlugs,
} from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';
import type { Product } from '@/lib/types';
import FAQAccordion from '@/components/ui/faq-accordion';
import AffiliateDisclosure from '@/components/ui/affiliate-disclosure';
import CTAButton from '@/components/ui/cta-button';
import ComparisonTable from '@/components/ui/comparison-table';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedCollectionSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return {
    title: collection.title,
    description: collection.meta_description,
    openGraph: {
      title: collection.title,
      description: collection.meta_description ?? undefined,
      type: 'website',
      url: `${SITE_URL}/l/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/l/${slug}` },
  };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default async function ListPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [collectionProducts, category] = await Promise.all([
    getCollectionProducts(collection.id),
    getCategoryById(collection.category_id),
  ]);

  const productIds = collectionProducts.map((cp) => cp.product_id);
  const products = await getProductsByIds(productIds);

  // Merge collection product info with product details
  const rankedProducts = collectionProducts
    .map((cp) => {
      const product = products.find((p) => p.id === cp.product_id);
      if (!product) return null;
      return { ...cp, product };
    })
    .filter((rp): rp is NonNullable<typeof rp> => rp !== null);

  // Breadcrumbs
  const breadcrumbs = [
    { label: '홈', href: '/' },
    ...(category ? [{ label: category.name, href: `/c/${category.slug}` }] : []),
    { label: collection.title, href: `/l/${slug}` },
  ];

  // JSON-LD: ItemList
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: collection.title,
    description: collection.meta_description,
    url: `${SITE_URL}/l/${slug}`,
    numberOfItems: rankedProducts.length,
    itemListElement: rankedProducts.map((rp, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: rp.product.name,
      url: rp.product.affiliate_url,
    })),
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

  // JSON-LD: FAQPage
  const faqJsonLd = collection.faq_json && collection.faq_json.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: collection.faq_json.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null;

  // ComparisonTable data
  const comparisonColumns = ['제품명', '브랜드', '가격대', '평점', '핵심 장점'];
  function getComparisonValue(product: Product, column: string): string {
    switch (column) {
      case '제품명': return product.name;
      case '브랜드': return product.brand ?? '-';
      case '가격대': return product.price ? `₩${formatPrice(product.price)}` : '-';
      case '평점': return product.rating ? `${product.rating}점` : '-';
      case '핵심 장점': return product.pros.length > 0 ? product.pros[0] : '-';
      default: return '-';
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
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

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{collection.title}</h1>
      {collection.description && (
        <p className="mt-3 text-gray-600 leading-relaxed">{collection.description}</p>
      )}

      {/* Ranked Product Cards */}
      <div className="mt-8 space-y-6">
        {rankedProducts.map((rp) => {
          const isTop = rp.rank === 1;
          return (
            <div
              key={rp.id}
              className={`rounded-lg border p-5 ${
                isTop ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-200'
              }`}
            >
              {/* Rank + Label */}
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isTop ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {rp.rank}
                </span>
                {rp.pick_label && (
                  <span className={`text-sm font-bold ${isTop ? 'text-orange-600' : 'text-blue-600'}`}>
                    {rp.pick_label}
                  </span>
                )}
              </div>

              {/* Product Image + Info */}
              {rp.product.image_url && (
                <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-gray-50">
                  <Image
                    src={rp.product.image_url}
                    alt={rp.product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="mt-3 text-lg font-bold text-gray-900">{rp.product.name}</h3>
              {rp.product.brand && (
                <p className="mt-0.5 text-sm text-gray-400">{rp.product.brand}</p>
              )}
              {rp.mini_review && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{rp.mini_review}</p>
              )}

              {/* Pros & Cons */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rp.product.pros.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700">장점</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
                      {rp.product.pros.map((pro, i) => (
                        <li key={i}>+ {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rp.product.cons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700">단점</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
                      {rp.product.cons.map((con, i) => (
                        <li key={i}>- {con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Price + CTAs */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {rp.product.price && (
                  <span className="text-lg font-bold text-gray-900">
                    ₩{formatPrice(rp.product.price)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CTAButton
                  href={rp.product.affiliate_url}
                  label="오늘 가격 확인하기"
                  variant="primary"
                  productId={rp.product.id}
                  pageSlug={slug}
                />
                {rp.product.search_keyword && (
                  <CTAButton
                    href={`https://www.coupang.com/np/search?component=&q=${encodeURIComponent(rp.product.search_keyword)}&channel=user`}
                    label="쿠팡에서 검색결과 보기"
                    variant="outline"
                    productId={rp.product.id}
                    pageSlug={slug}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      {rankedProducts.length >= 2 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">전체 비교</h2>
          <ComparisonTable
            products={rankedProducts.map((rp) => ({ ...rp.product, rank: rp.rank }))}
            columns={comparisonColumns}
            getValue={getComparisonValue}
          />
        </section>
      )}

      {/* FAQ */}
      {collection.faq_json && collection.faq_json.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900">자주 묻는 질문</h2>
          <FAQAccordion items={collection.faq_json} />
        </section>
      )}

      {/* Affiliate Disclosure */}
      <AffiliateDisclosure />
    </div>
  );
}
