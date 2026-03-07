export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || '추천가이드';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const NAV_ITEMS = [
  { label: '홈', href: '/' },
  { label: '블로그', href: '/blog' },
  { label: '베스트', href: '/best' },
  { label: '할인/특가', href: '/deals' },
] as const;

export const CATEGORIES = [
  { slug: 'electronics', name: '가전/IT' },
  { slug: 'car-accessories', name: '자동차/용품' },
  { slug: 'camping-outdoor', name: '캠핑/아웃도어' },
] as const;

export const AFFILIATE_DISCLOSURE =
  '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';
