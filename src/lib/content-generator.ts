import Anthropic from '@anthropic-ai/sdk';
import type { CoupangSearchResult } from './coupang-api';

const anthropic = new Anthropic();

interface GeneratedContent {
  title: string;
  slug: string;
  meta_description: string;
  excerpt: string;
  content: string;
  faq_json: { question: string; answer: string }[];
  primary_keyword: string;
  secondary_keywords: string[];
  products: {
    name: string;
    brand: string;
    price: number;
    pros: string[];
    cons: string[];
    pick_label: string;
    mini_review: string;
    rank: number;
  }[];
}

export async function generateContent(
  keyword: string,
  slug: string,
  coupangData: CoupangSearchResult
): Promise<GeneratedContent> {
  const productList = coupangData.products
    .slice(0, 5)
    .map(
      (p, i) =>
        `${i + 1}. ${p.productName} — ₩${p.productPrice.toLocaleString()} (로켓배송: ${p.isRocket ? '예' : '아니오'})`
    )
    .join('\n');

  const prompt = `당신은 한국어 제품 리뷰 전문 에디터입니다.
아래 키워드와 쿠팡 검색 결과를 기반으로 SEO 최적화된 추천 블로그 글을 작성하세요.

## 키워드
${keyword}

## 쿠팡 검색 결과 (상위 5개)
${productList}

## 반드시 지켜야 할 규칙
1. 제목: 반드시 "${keyword}" 키워드를 그대로 포함. 30~45자. 예시: "${keyword} — 2025년 인기 제품 비교"
2. meta_description: 80~120자, "${keyword}" 키워드를 첫 부분에 포함
3. 본문(content): 마크다운 형식, 1,200~1,600자 (한국어 기준)
   - H2 구성: ## 선정 기준, ## 추천 제품 비교, ## 최종 추천, ## 자주 묻는 질문
   - 첫 문단에 "${keyword}" 자연스럽게 삽입
   - 각 제품: 위 쿠팡 검색 결과의 실제 제품명 그대로 사용. 핵심 장점 1~2개, 주의할 점 1개, 추천 대상
4. products 배열: 위 쿠팡 검색 결과의 제품명을 그대로 사용 (임의로 바꾸지 말 것)
5. 각 제품의 장점(pros) 3개, 단점(cons) 2개
6. pick_label: 1위="최고 추천", 2위="가성비 추천", 나머지는 특징 기반
7. mini_review: 20~40자 한줄평
8. FAQ 3~5개 (People Also Ask 스타일, "${keyword}" 관련)
9. secondary_keywords 2~3개 (관련 검색어)
10. brand: 제품명에서 브랜드 추출 (없으면 "기타")

## 출력 형식 (순수 JSON만 출력, 마크다운 코드블록 없이)
{
  "title": "...",
  "meta_description": "...",
  "excerpt": "50~80자 요약...",
  "content": "마크다운 본문...",
  "faq_json": [{"question": "...", "answer": "..."}],
  "primary_keyword": "${keyword}",
  "secondary_keywords": ["...", "..."],
  "products": [
    {
      "name": "쿠팡 검색 결과의 실제 제품명",
      "brand": "브랜드",
      "price": 가격숫자,
      "pros": ["장점1", "장점2", "장점3"],
      "cons": ["단점1", "단점2"],
      "pick_label": "라벨",
      "mini_review": "한줄평",
      "rank": 순위숫자
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse generated content as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Omit<GeneratedContent, 'slug'>;

  return { ...parsed, slug };
}
