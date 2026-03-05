import Anthropic from '@anthropic-ai/sdk';
import type { CoupangSearchResult } from './coupang-api';

const anthropic = new Anthropic();

interface ProductGenerated {
  name: string;
  brand: string;
  price: number;
  emotion_summary: string;
  target_audience: string[];
  cautions: string[];
  spec_descriptions: string[];
  editor_comment: string;
  pick_label: string;
  rank: number;
}

export interface GeneratedContent {
  title: string;
  hero_subtitle: string;
  meta_description: string;
  excerpt: string;
  content: string;
  faq_json: { question: string; answer: string }[];
  primary_keyword: string;
  secondary_keywords: string[];
  slug: string;
  urgency: {
    title: string;
    points: string[];
  };
  situation_picks: {
    situation: string;
    product_name: string;
    product_index: number;
  }[];
  products: ProductGenerated[];
}

function getCategoryStrategy(categorySlug: string): string {
  switch (categorySlug) {
    case 'electronics':
      return `[스펙형 제품] 스펙 비교/차이점 설명 60%, 감정 40%. "이 스펙 차이가 실제로 어떤 체감인지"를 설명하라. 경쟁 제품과의 명확한 비교를 제공하라.`;
    case 'camping-outdoor':
      return `[감정형 제품] 감정 마케팅 비중 70%, 스펙 설명 30%. "이 제품이 있는 생활" vs "없는 생활"의 대비를 보여라. 계절, 공간, 가족의 변화 등 감정적 맥락을 활용하라.`;
    case 'car-accessories':
      return `[감정형 제품] 감정 마케팅 비중 70%, 스펙 설명 30%. 운전 중의 불편함, 안전, 쾌적함 등 일상 운전 경험과 연결하라.`;
    default:
      return `[감정형 제품] 감정 마케팅 비중 70%, 스펙 설명 30%.`;
  }
}

function getSeasonContext(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const seasons: Record<number, string> = {
    1: '겨울', 2: '겨울', 3: '봄', 4: '봄', 5: '봄',
    6: '여름', 7: '여름', 8: '여름', 9: '가을', 10: '가을', 11: '가을', 12: '겨울',
  };
  return `${year}년 ${month}월 (${seasons[month]})`;
}

export async function generateContent(
  keyword: string,
  slug: string,
  coupangData: CoupangSearchResult,
  categorySlug?: string,
): Promise<GeneratedContent> {
  const productList = coupangData.products
    .slice(0, 5)
    .map(
      (p, i) =>
        `${i + 1}. ${p.productName} — ₩${p.productPrice.toLocaleString()} (로켓배송: ${p.isRocket ? '예' : '아니오'})`
    )
    .join('\n');

  const strategy = getCategoryStrategy(categorySlug ?? 'electronics');
  const seasonContext = getSeasonContext();

  const prompt = `당신은 한국어 제품 리뷰 전문 에디터입니다. "먼저 써본 친한 형"의 말투로 씁니다.
현재 시점: ${seasonContext}

## 핵심 원칙: "감정 → 스펙 → 긴급성" 3단계 구조

### 카테고리 전략
${strategy}

### 톤 & 스타일
- "먼저 써본 친한 형/언니"의 말투. 전문 리뷰어 느낌 금지.
- 문장은 짧게. 한 문장에 하나의 포인트만.
- 자연스러운 공감 표현 사용 ("솔직히", "이건 진짜", "써보면 압니다")
- 과장 금지: "역대급", "미쳤다", "사기급", "무조건 이거" 사용 금지
- "~입니다", "~합니다"만 반복하는 단조로운 문체 금지. 구어체를 섞어라.

## 키워드
${keyword}

## 쿠팡 검색 결과 (상위 5개)
${productList}

## 생성 규칙

### title (제목)
- 검색 키워드 포함 + 감정적 호기심 유발. 30~45자.
- ❌ "2025 경량 캠핑의자 추천 TOP5 비교"
- ✅ "백패킹 3시간 후, 어깨가 감사한 캠핑의자 — 2025 경량 추천"

### hero_subtitle (히어로 부제목)
- 독자의 상황을 묘사하는 한 줄. 스펙/가격 넣지 말 것.
- 예: "3시간 능선 끝에 펼치는 의자 하나가, 그날 캠핑의 전부입니다"

### meta_description
- 80~120자, 감정 + 키워드 조합

### content (본문 마크다운)
- 1,200~1,600자. 3단계 구조를 따른다:

[1단계 — 감정 시나리오 도입, 전체 30%]
제품을 사용하는 "상황"과 "감정"으로 시작. 스펙으로 시작 금지.
독자가 "아, 나 이거 필요하다"고 느끼게 만드는 생활 속 장면 묘사.

[2단계 — 제품 비교 서술, 전체 40%]
각 제품을 감정에 스펙을 녹여서 서술. 소제목은 베네핏 중심.
❌ "무게 | 하중 | 가격"
✅ "어깨가 편한 무게 | 체중 걱정 없는 안정감 | 배낭에 쏙 들어가는 크기"
변환 공식: [스펙] + "그래서 당신은..." 으로 연결.

[3단계 — 최종 추천 + 마무리, 전체 30%]
상황별 추천 (가성비/프리미엄/입문용). 핵심 요약 한 줄.

- H2 구성: ## 왜 지금 이 제품인가, ## 제품별 솔직 비교, ## 누구에게 어떤 제품이 맞을까
- 첫 문단에 "${keyword}" 자연스럽게 삽입
- FAQ를 본문에 기계적으로 나열하지 말 것

### products 배열 (각 제품)
- name: 쿠팡 검색 결과의 실제 제품명 그대로
- emotion_summary: 스펙이 아닌 체감 한줄 요약 (20~40자)
  예: "3시간 산행 후에도 어깨가 살아있는 960g"
- target_audience: "이런 분께 딱 맞습니다" 2~3개 (감정/상황 기반)
  예: ["매주 산행하는데 무게가 고민인 분", "부부 캠핑에서 편안함이 최우선인 분"]
- cautions: "알아두세요" 1~2개 (부정적이 아닌 중립 정보 제공 톤)
  예: ["색상 선택지가 2가지로 제한됩니다", "조립 시 약간의 힘이 필요합니다"]
- spec_descriptions: 핵심 스펙 2~3개, 각각 "스펙 → 체감 설명" 형식
  예: ["960g → 500ml 물병보다 가볍습니다", "145kg 하중 → 체격 무관, 안심하세요"]
- editor_comment: 에디터의 솔직한 한마디 (30~50자, 써본 사람 느낌)
  예: "매주 북한산 가는데, 이거 바꾸고 무릎 통증이 줄었습니다"
- pick_label: 1위="에디터 추천", 2위="가성비 추천", 나머지는 특징 기반 (예: "입문용 추천")

### urgency (긴급성 섹션)
- title: 긴급성 제목 (예: "캠핑 시즌 시작 전이 가장 좋은 타이밍")
- points: 2~3개의 긴급성 포인트 (사실 기반, 과장 금지)
  유형: 시즌형/가격형/계산형/심리형 중 적합한 것 선택
  예: ["성수기 가격 인상 전, 지금이 연중 최저가 구간입니다", "13만원 ÷ 주1회 × 52주 = 회당 2,500원"]

### situation_picks (상황별 추천)
- 3개: 각각 { situation, product_name, product_index }
- 스펙 비교가 아니라 상황 기반으로
  예: [
    {"situation": "백패킹 위주, 무게가 생명", "product_name": "헬리녹스 체어원", "product_index": 0},
    {"situation": "차박/오토캠핑, 편안함이 우선", "product_name": "콜맨 리조트 체어", "product_index": 1},
    {"situation": "처음 시작, 부담 없이", "product_name": "XXX", "product_index": 2}
  ]

### faq_json
- 3개만 (더 많으면 이탈). 본문에서 이미 다룬 내용은 넣지 말 것.
- "People Also Ask" 스타일 질문

### secondary_keywords: 2~3개
### brand: 제품명에서 브랜드 추출 (없으면 "기타")

## 출력 형식 (순수 JSON만 출력, 마크다운 코드블록 없이)
{
  "title": "...",
  "hero_subtitle": "...",
  "meta_description": "...",
  "excerpt": "hero_subtitle과 동일한 값",
  "content": "마크다운 본문...",
  "faq_json": [{"question": "...", "answer": "..."}],
  "primary_keyword": "${keyword}",
  "secondary_keywords": ["...", "..."],
  "urgency": {"title": "...", "points": ["...", "..."]},
  "situation_picks": [{"situation": "...", "product_name": "...", "product_index": 0}],
  "products": [
    {
      "name": "쿠팡 검색 결과의 실제 제품명",
      "brand": "브랜드",
      "price": 가격숫자,
      "emotion_summary": "감정 한줄 요약",
      "target_audience": ["이런 분께 딱", "이런 분께 딱"],
      "cautions": ["알아두세요"],
      "spec_descriptions": ["스펙 → 체감설명", "스펙 → 체감설명"],
      "editor_comment": "에디터 한마디",
      "pick_label": "라벨",
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

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse generated content as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Omit<GeneratedContent, 'slug'>;

  return { ...parsed, slug };
}
