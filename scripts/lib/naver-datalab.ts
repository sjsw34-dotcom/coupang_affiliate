/**
 * Naver DataLab API — 검색 트렌드 조회
 * 키워드별 실제 검색량 추이를 가져와서 인기 키워드를 선별
 */

interface KeywordGroup {
  groupName: string;
  keywords: string[];
}

interface TrendResult {
  title: string;
  keywords: string[];
  data: { period: string; ratio: number }[];
}

interface NaverTrendResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: TrendResult[];
}

/**
 * 네이버 데이터랩 검색어 트렌드 API
 * 최대 5개 키워드 그룹을 비교하여 상대 검색량을 반환
 */
async function fetchSearchTrend(keywordGroups: KeywordGroup[]): Promise<TrendResult[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing NAVER_CLIENT_ID or NAVER_CLIENT_SECRET');
  }

  // 최근 3개월 트렌드 조회
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  const body = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    timeUnit: 'week',
    keywordGroups: keywordGroups.map((g) => ({
      groupName: g.groupName,
      keywords: g.keywords,
    })),
  };

  const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver API error: ${res.status} ${text}`);
  }

  const json: NaverTrendResponse = await res.json();
  return json.results;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 키워드 목록을 5개씩 배치로 나눠서 트렌드 점수를 매기고,
 * 최근 검색량 기준 내림차순으로 정렬하여 반환
 */
export async function rankKeywordsByTrend(
  keywords: string[]
): Promise<{ keyword: string; score: number }[]> {
  if (keywords.length === 0) return [];

  const results: { keyword: string; score: number }[] = [];

  // 네이버 API는 한 번에 최대 5개 키워드 그룹만 비교 가능
  const batchSize = 5;
  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);
    const groups: KeywordGroup[] = batch.map((kw) => ({
      groupName: kw,
      keywords: [kw],
    }));

    try {
      const trendResults = await fetchSearchTrend(groups);

      for (const result of trendResults) {
        // 최근 4주의 평균 검색량(ratio)을 점수로 사용
        const recentData = result.data.slice(-4);
        const avgRatio =
          recentData.length > 0
            ? recentData.reduce((sum, d) => sum + d.ratio, 0) / recentData.length
            : 0;

        results.push({
          keyword: result.title,
          score: Math.round(avgRatio * 100) / 100,
        });
      }

      // API 호출 간 딜레이 (rate limit 방지)
      if (i + batchSize < keywords.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (error) {
      console.log(`  Naver API batch error: ${error instanceof Error ? error.message : 'Unknown'}`);
      // 실패한 배치는 점수 0으로 추가
      for (const kw of batch) {
        results.push({ keyword: kw, score: 0 });
      }
    }
  }

  // 점수 내림차순 정렬
  return results.sort((a, b) => b.score - a.score);
}
