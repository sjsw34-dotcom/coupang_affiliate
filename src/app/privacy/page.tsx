import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: `${SITE_NAME} 개인정보처리방침`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">개인정보처리방침</h1>

      <div className="mt-6 space-y-4 text-sm text-gray-600">
        <p>
          {SITE_NAME}(이하 &quot;사이트&quot;)는 이용자의 개인정보를 중요시하며,
          개인정보 보호법을 준수합니다.
        </p>

        <h2 className="text-base font-bold text-gray-900">1. 수집하는 개인정보</h2>
        <p>
          본 사이트는 별도의 회원가입 없이 이용 가능합니다.
          서비스 이용 과정에서 IP 주소, 방문 일시, 서비스 이용 기록 등의
          정보가 자동으로 생성되어 수집될 수 있습니다.
        </p>

        <h2 className="text-base font-bold text-gray-900">2. 개인정보의 이용 목적</h2>
        <p>수집된 정보는 서비스 개선 및 통계 분석 목적으로만 사용됩니다.</p>

        <h2 className="text-base font-bold text-gray-900">3. 개인정보의 보유 및 파기</h2>
        <p>
          수집된 정보는 목적 달성 후 지체 없이 파기합니다.
        </p>

        <h2 className="text-base font-bold text-gray-900">4. 쿠키 사용</h2>
        <p>
          본 사이트는 이용자 경험 개선을 위해 쿠키를 사용할 수 있습니다.
          브라우저 설정에서 쿠키 허용 여부를 변경할 수 있습니다.
        </p>

        <h2 className="text-base font-bold text-gray-900">5. 제3자 링크</h2>
        <p>
          본 사이트에는 쿠팡 등 외부 쇼핑몰로의 제휴 링크가 포함되어 있습니다.
          외부 사이트의 개인정보 처리에 대해서는 해당 사이트의 방침을 확인해 주세요.
        </p>

        <p className="mt-4 text-xs text-gray-400">
          본 방침은 2026년 3월 5일부터 적용됩니다.
        </p>
      </div>
    </div>
  );
}
