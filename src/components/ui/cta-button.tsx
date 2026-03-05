'use client';

import { trackEvent } from '@/lib/track-event';

interface CTAButtonProps {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  productId?: string;
  pageSlug?: string;
}

const variantStyles = {
  primary:
    'bg-[#F05A28] text-white hover:bg-[#d94e20] font-bold w-full md:w-auto',
  secondary:
    'border border-[#F05A28] text-[#F05A28] hover:bg-orange-50 text-sm',
  outline:
    'border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm',
};

export default function CTAButton({
  href,
  label,
  variant = 'primary',
  productId,
  pageSlug,
}: CTAButtonProps) {
  const handleClick = () => {
    trackEvent({
      type: 'outbound',
      page_slug: pageSlug || window.location.pathname,
      target_url: href,
      product_id: productId,
    });
  };

  return (
    <a
      href={href}
      rel="nofollow noopener sponsored"
      target="_blank"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg px-5 py-3 text-center transition-colors ${variantStyles[variant]}`}
    >
      {label}
    </a>
  );
}
