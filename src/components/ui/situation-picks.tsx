'use client';

import type { Product } from '@/lib/types';
import CTAButton from './cta-button';

interface SituationPick {
  situation: string;
  product_name: string;
  product_index: number;
}

interface SituationPicksProps {
  picks: SituationPick[];
  products: Product[];
  pageSlug?: string;
}

export default function SituationPicks({ picks, products, pageSlug }: SituationPicksProps) {
  if (picks.length === 0) return null;

  return (
    <section className="my-10">
      <h2 className="mb-5 text-xl font-bold text-gray-900">
        <span className="mr-2">🎯</span>당신의 스타일은?
      </h2>
      <div className="space-y-3">
        {picks.map((pick, i) => {
          const product = products[pick.product_index] ?? products[0];
          if (!product) return null;
          return (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">&ldquo;{pick.situation}&rdquo;</p>
                <p className="mt-1 font-bold text-gray-900">→ {pick.product_name}</p>
              </div>
              <div className="shrink-0">
                <CTAButton
                  href={product.affiliate_url}
                  label="가격 보기"
                  variant="secondary"
                  productId={product.id}
                  pageSlug={pageSlug}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
