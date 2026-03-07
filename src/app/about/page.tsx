import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '소개',
  description: `${SITE_NAME} - 가전, 자동차용품, 캠핑용품 추천 전문 리뷰 사이트`,
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `${SITE_NAME} 소개`,
    url: `${SITE_URL}/about`,
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: '가전, 자동차용품, 캠핑용품 추천 및 비교 리뷰 전문 사이트',
    foundingDate: '2026',
  };

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: '에디터',
    jobTitle: '제품 리뷰 전문 에디터',
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };

  return (
    <div className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <h1 className="text-2xl font-bold text-gray-900">소개</h1>

      <div className="mt-6 space-y-6 text-gray-600 leading-relaxed">
        <p>
          <strong>{SITE_NAME}</strong>은 가전/IT, 자동차 용품, 캠핑/아웃도어 제품을
          스펙 기반으로 비교 분석하여 추천하는 전문 리뷰 사이트입니다.
        </p>

        <section>
          <h2 className="text-lg font-bold text-gray-900">리뷰 철학</h2>
          <p className="mt-2">
            저희는 직접 스펙을 비교하고 사용자 리뷰를 분석하여 추천합니다.
            광고비를 받고 특정 제품을 우대하지 않으며, 객관적인 데이터와
            실사용 경험을 기반으로 공정한 리뷰를 제공합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">선정 기준</h2>
          <p className="mt-2">
            모든 추천 제품은 다음 기준에 따라 선정됩니다:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>제조사 공식 스펙과 성능 데이터 기반 비교</li>
            <li>실제 사용자 리뷰 종합 분석 (최소 100건 이상)</li>
            <li>가격 대비 성능 (가성비) 평가</li>
            <li>장점과 단점을 모두 투명하게 공개</li>
            <li>정기적인 가격 및 스펙 업데이트</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">운영팀</h2>
          <p className="mt-2">
            제품 리뷰와 비교 분석을 전문으로 하는 에디터 팀이 운영합니다.
            각 카테고리별 전문 지식을 갖춘 리뷰어가 콘텐츠를 작성하며,
            객관적이고 정확한 정보를 제공하기 위해 지속적으로 노력합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">제휴 마케팅 안내</h2>
          <p className="mt-2">
            본 사이트는 쿠팡 파트너스 활동의 일환으로 제휴 링크를 포함하고 있으며,
            이를 통해 발생하는 수수료는 사이트 운영과 콘텐츠 제작에 사용됩니다.
            제휴 관계가 리뷰의 공정성에 영향을 미치지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">문의</h2>
          <p className="mt-2">
            제휴 문의, 제품 리뷰 요청, 또는 피드백은 아래 이메일로 보내주세요.
          </p>
          <p className="mt-1 font-medium text-gray-800">
            gogoxingrich@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
