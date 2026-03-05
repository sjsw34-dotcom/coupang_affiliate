import Anthropic from '@anthropic-ai/sdk';
import { getServiceClient } from './supabase';

const anthropic = new Anthropic();

interface GeneratedKeyword {
  keyword: string;
  slug: string;
  category_slug: 'electronics' | 'car-accessories' | 'camping-outdoor';
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

function getSeasonContext(now: Date): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const season = getSeason(month);

  const seasonalHints: Record<string, Record<string, string>> = {
    '봄': {
      electronics: '미세먼지 시즌 공기청정기, 봄맞이 청소가전, 알레르기 대비 가전',
      'car-accessories': '봄 세차용품, 미세먼지 차량용 공기청정기, 봄 나들이 차량용품',
      'camping-outdoor': '봄캠핑 장비, 피크닉용품, 봄 등산용품, 경량 텐트',
    },
    '여름': {
      electronics: '에어컨, 선풍기, 제습기, 아이스메이커, 냉풍기',
      'car-accessories': '차량용 선풍기, 썬팅, 차량용 냉장고, 여름 차박용품',
      'camping-outdoor': '여름 캠핑 쿨링용품, 타프, 모기퇴치기, 아이스박스, 물놀이용품',
    },
    '가을': {
      electronics: '건조기, 가습기, 온풍기, 전기장판 준비',
      'car-accessories': '가을 드라이브 용품, 차량 코팅, 가을 타이어 점검용품',
      'camping-outdoor': '가을 캠핑, 화로대, 핫팩, 방한 캠핑용품, 단풍 등산용품',
    },
    '겨울': {
      electronics: '전기장판, 온풍기, 가습기, 난방텐트, 전기히터',
      'car-accessories': '스노우체인, 겨울 타이어, 성에제거기, 차량 히팅시트',
      'camping-outdoor': '동계 캠핑, 난로, 방한 침낭, 핫팩, 겨울 등산용품',
    },
  };

  return `현재: ${year}년 ${month}월 (${season})
시즌 트렌드:
- 가전/IT: ${seasonalHints[season].electronics}
- 자동차/용품: ${seasonalHints[season]['car-accessories']}
- 캠핑/아웃도어: ${seasonalHints[season]['camping-outdoor']}`;
}

export async function generateKeywords(
  categorySlug: 'electronics' | 'car-accessories' | 'camping-outdoor',
  count: number = 1
): Promise<GeneratedKeyword[]> {
  const now = new Date();
  const year = now.getFullYear();
  const seasonContext = getSeasonContext(now);

  const supabase = getServiceClient();

  // Get existing keywords to avoid duplicates
  const { data: existingPosts } = await supabase
    .from('posts')
    .select('primary_keyword, slug')
    .eq('status', 'published');

  const existingKeywords = (existingPosts ?? []).map((p) => p.primary_keyword);
  const existingSlugs = (existingPosts ?? []).map((p) => p.slug);

  const categoryNames: Record<string, string> = {
    electronics: '가전/IT',
    'car-accessories': '자동차/용품',
    'camping-outdoor': '캠핑/아웃도어',
  };

  const prompt = `당신은 한국 쿠팡 쇼핑 트렌드 전문가입니다.

## 현재 시점
${seasonContext}

## 카테고리
${categoryNames[categorySlug]}

## 이미 사용된 키워드 (중복 금지)
${existingKeywords.length > 0 ? existingKeywords.join(', ') : '없음'}

## 이미 사용된 slug (중복 금지)
${existingSlugs.length > 0 ? existingSlugs.join(', ') : '없음'}

## 규칙
1. "${categoryNames[categorySlug]}" 카테고리에서 ${year}년 현재 시즌에 맞는 구매 의도 키워드 ${count}개를 생성하세요
2. 키워드 형식: "[제품군] 추천 ${year}" 또는 "[구체조건] [제품] 추천" (구매 의도 필수)
3. 위에 나열된 기존 키워드와 절대 중복되지 않아야 합니다
4. 현재 시즌(${getSeason(now.getMonth() + 1)})과 맞지 않는 제품은 제외
5. ${year}년 기준으로 키워드 작성 (과거 연도 사용 금지)
6. slug: 영문 소문자, 하이픈만 사용, 3자 이상 (예: best-air-purifier-${year})
7. slug도 기존 slug와 중복되면 안 됩니다

## 출력 형식 (순수 JSON만, 마크다운 코드블록 없이)
[
  {
    "keyword": "키워드",
    "slug": "english-slug",
    "category_slug": "${categorySlug}"
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse keyword generation response');
  }

  const keywords = JSON.parse(jsonMatch[0]) as GeneratedKeyword[];

  // Double-check no duplicates slipped through
  return keywords.filter(
    (k) =>
      !existingKeywords.includes(k.keyword) &&
      !existingSlugs.includes(k.slug)
  );
}
