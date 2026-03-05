'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import CTAButton from './cta-button';

interface ProductCardProps {
  product: Product;
  emotionSummary?: string;
  specDescriptions?: string[];
  editorComment?: string;
  pageSlug?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

const badgeColors: Record<string, string> = {
  '에디터 추천': 'bg-[#F5A623] text-white',
  '가성비 추천': 'bg-[#27AE60] text-white',
  '입문용 추천': 'bg-blue-500 text-white',
  '최고 추천': 'bg-[#F5A623] text-white',
};

export default function ProductCard({
  product,
  emotionSummary,
  specDescriptions,
  editorComment,
  pageSlug,
}: ProductCardProps) {
  const badgeStyle = product.badge
    ? badgeColors[product.badge] ?? 'bg-gray-500 text-white'
    : '';

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg">
      {/* Badge */}
      {product.badge && (
        <div className="px-6 pt-5">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${badgeStyle}`}>
            {product.badge}
          </span>
        </div>
      )}

      {/* Image */}
      {product.image_url && (
        <div className="relative mx-6 mt-4 aspect-video overflow-hidden rounded-xl bg-gray-50">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-3"
          />
        </div>
      )}

      <div className="p-6">
        {/* Name + Emotion Summary */}
        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
        {product.brand && (
          <p className="mt-0.5 text-xs text-gray-400">{product.brand}</p>
        )}
        {emotionSummary && (
          <p className="mt-2 text-sm text-gray-600 italic">
            &ldquo;{emotionSummary}&rdquo;
          </p>
        )}

        {/* Target Audience — 이런 분께 딱 맞습니다 */}
        {product.pros.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold text-gray-500 tracking-wider">
              ── 이런 분께 딱 맞습니다 ──
            </p>
            <ul className="space-y-1">
              {product.pros.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-[#27AE60]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cautions — 알아두세요 */}
        {product.cons.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-gray-500 tracking-wider">
              ── 알아두세요 ──
            </p>
            <ul className="space-y-1">
              {product.cons.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="mt-0.5">△</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Spec Descriptions — 핵심 스펙 */}
        {specDescriptions && specDescriptions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-gray-500 tracking-wider">
              ── 핵심 스펙 ──
            </p>
            <ul className="space-y-1">
              {specDescriptions.map((spec, i) => (
                <li key={i} className="text-sm text-gray-700">{spec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Editor Comment */}
        {editorComment && (
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <span className="mr-1">💬</span> &ldquo;{editorComment}&rdquo;
          </p>
        )}

        {/* Price + CTA */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {product.price && (
            <span className="text-xl font-bold text-gray-900">
              ₩{formatPrice(product.price)}
            </span>
          )}
        </div>
        <div className="mt-3">
          <CTAButton
            href={product.affiliate_url}
            label="쿠팡에서 가격 보기"
            variant="primary"
            productId={product.id}
            pageSlug={pageSlug}
          />
        </div>
      </div>
    </div>
  );
}
