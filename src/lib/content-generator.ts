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
      return `[스펙형 제품이지만 감정이 우선] 스펙은 "체감"으로만 설명. 수치 나열 금지.
"이 스펙 차이가 당신의 하루를 어떻게 바꾸는지"로 풀어라.
예: "CADR 500이라 30평 거실이 7분 만에 바뀝니다" (O)
"CADR 500입니다" (X)
경쟁 제품과의 차이를 일상 시나리오로 비교하라.`;
    case 'camping-outdoor':
      return `[감정 올인] 캠핑은 라이프스타일이다. 스펙은 최소한만.
"이 장비와 함께한 하루"를 영화처럼 묘사하라.
새벽 공기, 모닥불 옆의 편안함, 자연 속 가족의 웃음 — 이런 장면이 나와야 한다.
독자가 글을 읽으면서 자기가 캠핑장에 있는 것처럼 느끼게 하라.`;
    case 'car-accessories':
      return `[일상 밀착 감정] 매일 반복되는 출퇴근, 주말 드라이브, 가족 나들이.
"매일 차에 탈 때마다 느끼는 작은 불편"을 해결하는 이야기로 풀어라.
운전석에 앉는 순간부터 시작되는 스토리텔링.`;
    default:
      return `[감정 우선] 제품이 있는 삶 vs 없는 삶의 대비.`;
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

// 5가지 콘텐츠 구조 템플릿 — Google이 다양한 콘텐츠로 인식하도록
function getContentTemplate(): { id: number; name: string; structure: string } {
  const templates = [
    {
      id: 1,
      name: '감정 시나리오형',
      structure: `[1단계 — 감정 시나리오 도입부: 500~800자]
- 독자가 "아, 이거 내 이야기다"라고 느끼는 구체적인 생활 장면으로 시작
- 계절, 시간, 장소, 오감(소리, 냄새, 촉감)을 동원한 현장감 있는 묘사
- 이 장면에서 자연스럽게 제품의 필요성으로 연결

[2단계 — 제품별 깊은 비교: 1,200~1,800자]
- H2 소제목은 스펙이 아니라 "이 제품이 바꿔주는 일상"
- 각 제품을 독립적인 스토리로 서술
- 스펙을 말할 때는 반드시 체감으로 변환

[3단계 — 최종 추천 + 감정적 마무리: 500~800자]
- 상황별 명확한 추천
- 가격을 "투자"로 프레이밍`,
    },
    {
      id: 2,
      name: '문제 해결형',
      structure: `[1단계 — 문제 제기: 400~600자]
- "당신이 겪고 있는 이 문제, 혼자가 아닙니다" 톤
- 구체적인 불편 상황 3가지를 나열
- 통계나 수치로 문제의 심각성을 뒷받침 (예: "한국인 78%가 이 문제를 겪고 있습니다")

[2단계 — 해결 기준 제시: 300~500자]
- "이 문제를 해결하려면 이 3가지를 봐야 합니다"
- 선택 기준을 명확하게 정리 (체크리스트 형태)

[3단계 — 솔루션별 분석: 1,200~1,600자]
- 각 제품이 위 기준을 어떻게 충족하는지 구조적으로 분석
- "문제 → 이 제품의 해결 방식 → 실제 체감" 흐름
- 제품마다 "이 제품이 해결하는 핵심 문제 하나" 명시

[4단계 — 결론: 300~500자]
- 문제 유형별 추천 ("~한 문제라면 A, ~한 상황이면 B")
- 행동 유도`,
    },
    {
      id: 3,
      name: '비교 대결형',
      structure: `[1단계 — 비교 프레임 설정: 300~500자]
- "오늘의 대결: A vs B vs C" 흥미 유발
- 왜 이 제품들을 비교하는지 (가격대, 인기, 용도가 비슷)
- "승자는 누구? 끝까지 읽어보시죠" 톤

[2단계 — 라운드별 비교: 1,500~2,000자]
- H2로 비교 항목별 라운드 구성 (예: "1라운드: 소음", "2라운드: 성능")
- 각 라운드마다 승자를 선정하고 이유 설명
- 표나 점수 형태로 시각적 정리
- "이 라운드의 승자: A (이유: ~)" 명확히

[3단계 — 종합 판정: 400~600자]
- 총점 합산 또는 종합 평가
- "절대 승자는 없습니다. 당신의 상황에 따라 달라집니다"
- 상황별 최종 추천`,
    },
    {
      id: 4,
      name: '질문 답변형',
      structure: `[1단계 — 핵심 질문으로 시작: 300~400자]
- "당신도 이런 고민 하고 계시죠?" 3가지 질문 던지기
- 독자가 고개를 끄덕이게 만드는 공감 질문
- "이 글에서 전부 답해드리겠습니다"

[2단계 — Q&A 형식 본문: 1,500~2,000자]
- H2를 전부 질문 형태로 구성
  예: "## 10만원대에서 진짜 쓸만한 제품이 있나요?"
  예: "## 소음이 적은 건 어떤 거예요?"
  예: "## 가성비 1등은 뭐예요?"
- 각 질문에 대해 2~3개 제품을 비교하며 답변
- 답변 톤: 친구에게 설명하듯 편하게

[3단계 — 한줄 정리: 300~500자]
- 질문별 답변을 한 줄씩 정리하는 치트시트
- 최종 추천`,
    },
    {
      id: 5,
      name: '타임라인 체험형',
      structure: `[1단계 — Before 장면: 400~600자]
- 이 제품이 없는 일상을 생생하게 묘사
- 불편함, 아쉬움, 걱정을 오감으로 표현
- "이런 날이 매일 반복됩니다"

[2단계 — 제품 도입기: 300~500자]
- 어떤 계기로 구매를 결심했는지 (자연스러운 내러티브)
- 고민 과정: "처음엔 A를 보다가, 리뷰를 읽고 B로 마음이 기울었습니다"

[3단계 — After 장면 (제품별): 1,200~1,600자]
- 각 제품을 "사용 1일차 → 1주차 → 1달차" 타임라인으로 묘사
- 시간이 지나면서 느끼는 변화를 구체적으로
- "처음엔 몰랐는데, 일주일 쓰니 ~가 달라졌습니다"

[4단계 — 총정리: 400~600자]
- Before vs After 핵심 변화 3줄 정리
- "돌아갈 수 없습니다" 톤으로 마무리
- 상황별 추천`,
    },
  ];

  return templates[Math.floor(Math.random() * templates.length)];
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

  const avgPrice = Math.round(
    coupangData.products.slice(0, 5).reduce((sum, p) => sum + p.productPrice, 0)
    / Math.min(coupangData.products.length, 5)
  );

  const strategy = getCategoryStrategy(categorySlug ?? 'electronics');
  const seasonContext = getSeasonContext();
  const template = getContentTemplate();

  const prompt = `당신은 한국 최고의 제품 리뷰 에디터입니다.
"먼저 써본 친한 형"처럼 솔직하게, 그러나 프로페셔널하게 씁니다.
지금부터 쓰는 글 하나로 독자가 구매 결정을 내려야 합니다.

현재 시점: ${seasonContext}
평균 제품 가격: ₩${avgPrice.toLocaleString()}

## 절대 원칙

### 글의 무게는 가격에 비례한다
- 5만원 제품: 가볍게 써도 된다
- 50만원 이상: 꼼꼼한 비교, 디테일한 체감 설명이 필요하다
- 100만원 이상: 구매를 "투자"로 프레이밍하라. 장기적 가치, 일상의 변화를 깊게 설득해야 한다.
- 이 글의 제품은 평균 ₩${avgPrice.toLocaleString()}이다. 그에 맞는 깊이와 설득력으로 써라.

### 톤 & 스타일
- "먼저 써본 친한 형"의 말투. 문장은 짧고 리듬감 있게.
- 구어체를 자연스럽게 섞어라 ("솔직히", "이건 진짜", "써보면 압니다", "근데 말이죠")
- "~입니다/합니다"만 반복하면 로봇이다. 다양한 문체를 섞어라.
- 과장 금지: "역대급", "미쳤다", "사기급" 사용하면 신뢰를 잃는다.
- 대신: "써보고 납득했습니다", "가격값은 확실히 합니다", "이 가격에 이 성능이면 훔친 거죠"

### 카테고리 전략
${strategy}

## 키워드
${keyword}

## 쿠팡 검색 결과 (상위 5개)
${productList}

## 생성해야 할 JSON 필드

### title (30~45자)
검색 키워드 + 감정적 호기심. 클릭하고 싶어지는 제목.
❌ "봄철 미세먼지 공기청정기 추천 TOP5"
✅ "봄바람은 열고 싶은데 미세먼지가 무서울 때 — 2026 공기청정기 추천"
✅ "120만원 공기청정기, 3개월 써보고 솔직히 말합니다"

### hero_subtitle (40~60자)
독자의 상황/감정을 한 문장으로 관통하는 부제목. 스펙/가격 넣지 말 것.
예: "환기 한 번 하고 싶은데 미세먼지 수치 확인하는 게 일상이 된 당신에게"

### meta_description (80~120자)
감정 + 키워드 조합

### content (마크다운 본문)
⚠️ 최소 3,000자 이상. 가격이 높을수록 더 길게 써라. ⚠️

📌 이번 글의 구조 템플릿: "${template.name}" (템플릿 #${template.id})
아래 구조를 반드시 따르되, 자연스럽게 풀어라:

${template.structure}

### 글쓰기 핵심 규칙 (모든 템플릿 공통)
- H2 소제목은 스펙이 아니라 체감/감정:
  ❌ "## 소음 | CADR | 필터 수명"
  ✅ "## 새벽 2시에도 켜놔도 되는 조용함"
- 스펙을 말할 때는 반드시 체감으로 변환:
  "CADR 500 → 30평 거실이 7분 만에 맑아집니다"
  "35dB → 옆에서 책 넘기는 소리보다 조용합니다"
- 각 제품마다 "킬링 포인트 한 줄" + "누가 쓰면 가장 만족할지" 포함
- 제품 간 직접 비교 문장 포함
- 구체적인 생활 장면 묘사 (오감 동원)
- 마지막에 행동 유도 (자연스럽게)

### products 배열
name: 쿠팡 검색 결과의 실제 제품명 그대로 사용 (절대 변경 금지)

emotion_summary (30~50자): 스펙이 아닌 체감/감정 한줄
  ✅ "새벽에 켜놔도 가족 아무도 모르는 조용함"
  ✅ "아이 방에 넣어두면 미세먼지 걱정이 사라집니다"
  ❌ "CADR 500의 뛰어난 성능"

target_audience (3개): "이런 분께 딱 맞습니다"
  - 구체적인 상황/라이프스타일 기반
  ✅ ["아이가 있는 30평대 아파트 가정", "미세먼지 시즌에 환기가 고민인 분", "소음에 예민해서 밤새 틀어놔야 하는 분"]
  ❌ ["공기청정기가 필요한 분", "좋은 제품을 원하는 분"]

cautions (1~2개): "알아두세요" (부정적X, 중립적 정보)
  ✅ ["필터 교체 비용이 연 8만원 수준입니다 — 미리 예산에 넣어두세요"]
  ❌ ["비쌉니다", "단점이 있습니다"]

spec_descriptions (3개): "스펙 → 체감 설명"
  ✅ ["CADR 500㎥/h → 30평 거실이 7분이면 맑아집니다", "35dB 수면모드 → 책 넘기는 소리보다 조용합니다", "H13 헤파필터 → 0.1μm 초미세먼지 99.97% 제거"]
  ❌ ["CADR 500", "소음 35dB", "헤파필터"]

editor_comment (40~60자): 실제 써본 사람처럼 솔직한 한마디
  ✅ "3개월째 거실에서 24시간 돌리는 중인데, 솔직히 없으면 불안합니다"
  ❌ "좋은 제품입니다"

pick_label: "에디터 추천", "가성비 추천", "입문용 추천" 등

### urgency
title: 긴급성 제목 (예: "미세먼지 시즌, 준비는 시작되기 전에")
points: 2~3개. 과장 없이 사실 기반.
  - 시즌형: "3월 말부터 미세먼지 농도가 급격히 올라갑니다. 주문 후 설치까지 3~5일 소요."
  - 계산형: "₩${avgPrice.toLocaleString()} ÷ 365일 × 5년 = 하루 약 ${Math.round(avgPrice / 365 / 5).toLocaleString()}원. 카페 음료 한 잔보다 쌉니다."
  - 심리형: "매일 숨쉬는 공기인데, '나중에 사야지' 하며 미루고 있진 않으신가요?"

### situation_picks (3개)
상황 기반 추천. 스펙 비교가 아님.
  ✅ [
    {"situation": "아이 있는 가정, 초미세먼지가 걱정될 때", "product_name": "...", "product_index": 0},
    {"situation": "혼자 사는 원룸, 가성비가 중요할 때", "product_name": "...", "product_index": 1},
    {"situation": "넓은 거실, 강력한 정화력이 필요할 때", "product_name": "...", "product_index": 2}
  ]

### faq_json: 3개만. 본문과 중복 금지.
### secondary_keywords: 2~3개

## 출력 (순수 JSON만, 코드블록 없이)
{
  "title": "...",
  "hero_subtitle": "...",
  "meta_description": "...",
  "excerpt": "hero_subtitle과 동일",
  "content": "마크다운 본문 (최소 3,000자)...",
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
      "emotion_summary": "...",
      "target_audience": ["...", "...", "..."],
      "cautions": ["..."],
      "spec_descriptions": ["스펙 → 체감", "스펙 → 체감", "스펙 → 체감"],
      "editor_comment": "...",
      "pick_label": "라벨",
      "rank": 순위
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
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
