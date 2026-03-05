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
    'bg-[#1A73E8] text-white hover:bg-[#1557b0] font-bold w-full md:w-auto min-h-[48px]',
  secondary:
    'border-2 border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50 font-medium min-h-[48px]',
  outline:
    'border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm min-h-[48px]',
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
