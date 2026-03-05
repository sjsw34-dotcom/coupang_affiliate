'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import CTAButton from './cta-button';

interface EditorPickCardProps {
  product: Product;
  emotionSummary?: string;
  editorComment?: string;
  pageSlug?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default function EditorPickCard({
  product,
  emotionSummary,
  editorComment,
  pageSlug,
}: EditorPickCardProps) {
  return (
    <div className="my-8 overflow-hidden rounded-2xl border-2 border-[#F5A623] bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-[#F5A623] px-3 py-1 text-xs font-bold text-white">
          에디터 추천
        </span>
      </div>

      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        {product.image_url && (
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-gray-50 md:w-48">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              className="object-contain p-3"
            />
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
          {emotionSummary && (
            <p className="mt-1 text-sm text-gray-600">&ldquo;{emotionSummary}&rdquo;</p>
          )}

          {product.price && (
            <p className="mt-3 text-xl font-bold text-gray-900">
              ₩{formatPrice(product.price)}
            </p>
          )}

          <div className="mt-4">
            <CTAButton
              href={product.affiliate_url}
              label="최저가 확인하기"
              variant="primary"
              productId={product.id}
              pageSlug={pageSlug}
            />
          </div>

          {editorComment && (
            <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <span className="mr-1">💬</span> &ldquo;{editorComment}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
