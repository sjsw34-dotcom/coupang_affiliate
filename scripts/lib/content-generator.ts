/**
 * Content generator — standalone version (no Next.js dependency)
 * Mirrors src/lib/content-generator.ts
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
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

const ALL_TEMPLATES = [
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
- 통계나 수치로 문제의 심각성을 뒷받침

[2단계 — 해결 기준 제시: 300~500자]
- "이 문제를 해결하려면 이 3가지를 봐야 합니다"
- 선택 기준을 명확하게 정리

[3단계 — 솔루션별 분석: 1,200~1,600자]
- 각 제품이 위 기준을 어떻게 충족하는지 구조적으로 분석
- "문제 → 이 제품의 해결 방식 → 실제 체감" 흐름

[4단계 — 결론: 300~500자]
- 문제 유형별 추천
- 행동 유도`,
  },
  {
    id: 3,
    name: '비교 대결형',
    structure: `[1단계 — 비교 프레임 설정: 300~500자]
- "오늘의 대결: A vs B vs C" 흥미 유발
- 왜 이 제품들을 비교하는지

[2단계 — 라운드별 비교: 1,500~2,000자]
- H2로 비교 항목별 라운드 구성
- 각 라운드마다 승자를 선정하고 이유 설명

[3단계 — 종합 판정: 400~600자]
- 총점 합산 또는 종합 평가
- 상황별 최종 추천`,
  },
  {
    id: 4,
    name: '질문 답변형',
    structure: `[1단계 — 핵심 질문으로 시작: 300~400자]
- "당신도 이런 고민 하고 계시죠?" 3가지 질문 던지기
- 독자가 고개를 끄덕이게 만드는 공감 질문

[2단계 — Q&A 형식 본문: 1,500~2,000자]
- H2를 전부 질문 형태로 구성
- 각 질문에 대해 2~3개 제품을 비교하며 답변

[3단계 — 한줄 정리: 300~500자]
- 질문별 답변을 한 줄씩 정리하는 치트시트
- 최종 추천`,
  },
  {
    id: 5,
    name: '타임라인 체험형',
    structure: `[1단계 — Before 장면: 400~600자]
- 이 제품이 없는 일상을 생생하게 묘사

[2단계 — 제품 도입기: 300~500자]
- 어떤 계기로 구매를 결심했는지

[3단계 — After 장면 (제품별): 1,200~1,600자]
- 각 제품을 "사용 1일차 → 1주차 → 1달차" 타임라인으로 묘사

[4단계 — 총정리: 400~600자]
- Before vs After 핵심 변화 3줄 정리
- 상황별 추천`,
  },
];

function getContentTemplate(excludeIds: number[] = []) {
  const available = ALL_TEMPLATES.filter((t) => !excludeIds.includes(t.id));
  const pool = available.length > 0 ? available : ALL_TEMPLATES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function getRecentTemplateIds(limit = 5): Promise<number[]> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data } = await supabase
    .from('posts')
    .select('content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (!data) return [];
  const ids: number[] = [];
  for (const post of data) {
    const match = post.content.match(/<!--TEMPLATE:([\s\S]*?)-->/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.template_id) ids.push(parsed.template_id);
      } catch { /* ignore */ }
    }
  }
  return ids;
}

export async function generateContent(
  keyword: string,
  slug: string,
  coupangData: CoupangSearchResult,
  categorySlug?: string,
  excludeTemplateIds: number[] = [],
): Promise<GeneratedContent & { template_id: number }> {
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
  const template = getContentTemplate(excludeTemplateIds);

  const prompt = `당신은 한국 최고의 제품 리뷰 에디터입니다.
"먼저 써본 친한 형"처럼 솔직하게, 그러나 프로페셔널하게 씁니다.
지금부터 쓰는 글 하나로 독자가 구매 결정을 내려야 합니다.

현재 시점: ${seasonContext}
평균 제품 가격: ₩${avgPrice.toLocaleString()}

## 절대 원칙

### 글의 무게는 가격에 비례한다
- 5만원 제품: 가볍게 써도 된다
- 50만원 이상: 꼼꼼한 비교, 디테일한 체감 설명이 필요하다
- 100만원 이상: 구매를 "투자"로 프레이밍하라.
- 이 글의 제품은 평균 ₩${avgPrice.toLocaleString()}이다. 그에 맞는 깊이와 설득력으로 써라.

### 톤 & 스타일
- "먼저 써본 친한 형"의 말투. 문장은 짧고 리듬감 있게.
- 구어체를 자연스럽게 섞어라
- 과장 금지: "역대급", "미쳤다", "사기급" 사용하면 신뢰를 잃는다.

### 카테고리 전략
${strategy}

## 키워드
${keyword}

## 쿠팡 검색 결과 (상위 5개)
${productList}

## 생성해야 할 JSON 필드

### title (30~45자)
검색 키워드 + 감정적 호기심.

### hero_subtitle (40~60자)
독자의 상황/감정을 한 문장으로 관통하는 부제목.

### meta_description (80~120자)
감정 + 키워드 조합

### content (마크다운 본문)
⚠️ 최소 3,000자 이상. ⚠️

📌 이번 글의 구조 템플릿: "${template.name}" (템플릿 #${template.id})

${template.structure}

### 글쓰기 핵심 규칙
- H2 소제목은 스펙이 아니라 체감/감정
- 스펙을 말할 때는 반드시 체감으로 변환
- 각 제품마다 "킬링 포인트 한 줄" + "누가 쓰면 가장 만족할지" 포함
- 제품 간 직접 비교 문장 포함
- 구체적인 생활 장면 묘사

### products 배열
name: 쿠팡 검색 결과의 실제 제품명 그대로 사용

emotion_summary (30~50자): 스펙이 아닌 체감/감정 한줄
target_audience (3개): 구체적인 상황/라이프스타일 기반
cautions (1~2개): 중립적 정보
spec_descriptions (3개): "스펙 → 체감 설명"
editor_comment (40~60자): 솔직한 한마디
pick_label: "에디터 추천", "가성비 추천" 등

### urgency
title: 긴급성 제목
points: 2~3개. 사실 기반.

### situation_picks (3개)
상황 기반 추천.

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

  return { ...parsed, slug, template_id: template.id };
}
