import Image from 'next/image';
import type { Product } from '@/lib/types';
import CTAButton from './cta-button';

interface ProductCardProps {
  product: Product;
  pageSlug?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="text-sm text-yellow-500" aria-label={`${rating}점`}>
      {'★'.repeat(full)}
      {hasHalf && '½'}
      {'☆'.repeat(5 - full - (hasHalf ? 1 : 0))}
    </span>
  );
}

export default function ProductCard({ product, pageSlug }: ProductCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-video bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            이미지 준비 중
          </div>
        )}
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gray-400">{product.brand}</p>
        )}
        <h3 className="mt-1 font-semibold text-gray-900">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          {product.rating && <RatingStars rating={product.rating} />}
          {product.price && (
            <span className="font-bold text-gray-900">
              ₩{formatPrice(product.price)}
            </span>
          )}
        </div>
        <div className="mt-3">
          <CTAButton
            href={product.affiliate_url}
            label="오늘 가격 확인"
            variant="primary"
            productId={product.id}
            pageSlug={pageSlug}
          />
        </div>
      </div>
    </div>
  );
}
