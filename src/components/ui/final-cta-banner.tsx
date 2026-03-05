'use client';

import type { Product } from '@/lib/types';
import CTAButton from './cta-button';

interface FinalCtaBannerProps {
  urgencyTitle: string;
  topProduct: Product;
  secondProduct?: Product;
  pageSlug?: string;
}

export default function FinalCtaBanner({
  urgencyTitle,
  topProduct,
  secondProduct,
  pageSlug,
}: FinalCtaBannerProps) {
  return (
    <section className="my-10 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 md:p-8 text-center">
      <p className="text-lg font-bold text-gray-900">
        {urgencyTitle || '지금이 가장 좋은 타이밍입니다'}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        시즌이 시작되면 인기 제품은 품절되고, 가격은 올라갑니다.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <CTAButton
          href={topProduct.affiliate_url}
          label="에디터 추천 최저가 확인"
          variant="primary"
          productId={topProduct.id}
          pageSlug={pageSlug}
        />
        {secondProduct && (
          <CTAButton
            href={secondProduct.affiliate_url}
            label="가성비 추천 보기"
            variant="secondary"
            productId={secondProduct.id}
            pageSlug={pageSlug}
          />
        )}
      </div>
    </section>
  );
}
