import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, AFFILIATE_DISCLOSURE } from '@/lib/constants';

export const metadata: Metadata = {
  title: '면책 고지',
  description: `${SITE_NAME} 제휴 마케팅 고지 및 면책 사항`,
  alternates: { canonical: `${SITE_URL}/disclaimer` },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">면책 고지</h1>

      <div className="mt-6 space-y-4 text-sm text-gray-600">
        <h2 className="text-base font-bold text-gray-900">제휴 마케팅 고지</h2>
        <p className="rounded-lg bg-gray-50 p-4 font-medium">{AFFILIATE_DISCLOSURE}</p>

        <h2 className="text-base font-bold text-gray-900">리뷰 기준</h2>
        <p>
          본 사이트의 모든 제품 추천 및 리뷰는 다음 기준에 따라 작성됩니다:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>제조사 공식 스펙 기반 객관적 비교</li>
          <li>실제 사용자 리뷰 종합 분석</li>
          <li>가격 대비 성능 평가</li>
          <li>장점과 단점 모두 투명 공개</li>
        </ul>

        <h2 className="text-base font-bold text-gray-900">면책 사항</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            제품 가격, 재고, 스펙은 수시로 변경될 수 있습니다.
            최신 정보는 쿠팡에서 직접 확인해 주세요.
          </li>
          <li>
            본 사이트의 추천은 참고용이며, 최종 구매 결정은 소비자 본인의 판단에 따릅니다.
          </li>
          <li>
            제휴 링크를 통한 구매 시 사이트 운영자에게 소정의 수수료가 지급되며,
            이는 구매자에게 추가 비용을 발생시키지 않습니다.
          </li>
        </ul>

        <p className="mt-4 text-xs text-gray-400">
          본 고지는 2026년 3월 5일부터 적용됩니다.
        </p>
      </div>
    </div>
  );
}
