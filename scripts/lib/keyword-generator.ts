/**
 * Keyword generator — 네이버 데이터랩 트렌드 기반
 * Claude API 호출 없이 실제 검색 트렌드로 키워드 선정
 */
import { createClient } from '@supabase/supabase-js';
import { rankKeywordsByTrend } from './naver-datalab';
import { KEYWORD_POOL } from './keyword-pool';

interface GeneratedKeyword {
  keyword: string;
  slug: string;
  category_slug: 'electronics' | 'car-accessories' | 'camping-outdoor';
}

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function generateKeywords(
  categorySlug: 'electronics' | 'car-accessories' | 'camping-outdoor',
  count: number = 1
): Promise<GeneratedKeyword[]> {
  const year = new Date().getFullYear();
  const supabase = getSupabase();

  // 1. 이미 사용된 키워드/slug 조회
  const { data: existingPosts } = await supabase
    .from('posts')
    .select('primary_keyword, slug')
    .eq('status', 'published');

  const usedKeywords = new Set((existingPosts ?? []).map((p) => p.primary_keyword));
  const usedSlugs = new Set((existingPosts ?? []).map((p) => p.slug));

  // 2. 키워드 풀에서 미사용 키워드 필터링
  const pool = KEYWORD_POOL[categorySlug] ?? [];
  const available = pool.filter((item) => {
    const slugWithYear = `${item.slug}-${year}`;
    return (
      !usedKeywords.has(item.keyword) &&
      !usedKeywords.has(`${item.keyword} ${year}`) &&
      !usedSlugs.has(item.slug) &&
      !usedSlugs.has(slugWithYear)
    );
  });

  if (available.length === 0) {
    console.log(`  No unused keywords in pool for ${categorySlug}`);
    return [];
  }

  // 3. 네이버 트렌드 API로 검색량 순위 매기기
  let ranked: typeof available;
  try {
    const keywords = available.map((a) => a.keyword);
    const trendResults = await rankKeywordsByTrend(keywords);

    // 트렌드 점수 순으로 정렬된 키워드에 매칭
    const scoreMap = new Map(trendResults.map((r) => [r.keyword, r.score]));
    ranked = [...available].sort((a, b) => {
      const scoreA = scoreMap.get(a.keyword) ?? 0;
      const scoreB = scoreMap.get(b.keyword) ?? 0;
      return scoreB - scoreA;
    });

    const topKeyword = ranked[0];
    const topScore = scoreMap.get(topKeyword.keyword) ?? 0;
    console.log(`  Naver trend: top keyword "${topKeyword.keyword}" (score: ${topScore})`);
  } catch (error) {
    console.log(`  Naver API failed, using random selection: ${error instanceof Error ? error.message : 'Unknown'}`);
    // 네이버 API 실패 시 랜덤 선택
    ranked = [...available].sort(() => Math.random() - 0.5);
  }

  // 4. 상위 count개 반환
  return ranked.slice(0, count).map((item) => ({
    keyword: item.keyword,
    slug: `${item.slug}-${year}`,
    category_slug: categorySlug,
  }));
}
