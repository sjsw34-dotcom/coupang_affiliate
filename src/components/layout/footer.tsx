import Link from 'next/link';
import { SITE_NAME, AFFILIATE_DISCLOSURE } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="font-bold text-gray-900">{SITE_NAME}</p>
            <p className="mt-2 text-sm text-gray-500">
              가전, 자동차용품, 캠핑용품 추천 및 비교 리뷰
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">카테고리</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/c/electronics" className="text-sm text-gray-500 hover:text-gray-900">
                  가전/IT
                </Link>
              </li>
              <li>
                <Link href="/c/car-accessories" className="text-sm text-gray-500 hover:text-gray-900">
                  자동차/용품
                </Link>
              </li>
              <li>
                <Link href="/c/camping-outdoor" className="text-sm text-gray-500 hover:text-gray-900">
                  캠핑/아웃도어
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900">안내</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900">
                  소개
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-sm text-gray-500 hover:text-gray-900">
                  면책 고지
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">{AFFILIATE_DISCLOSURE}</p>
          <p className="mt-1 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
