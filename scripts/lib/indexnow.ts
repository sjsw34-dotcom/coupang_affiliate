/**
 * IndexNow API — 네이버, Bing, Yandex 등에 자동 색인 요청
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chulmall.com';
const INDEXNOW_KEY = '23df5e8b43a848cfa5d125719fde0332';

export async function requestIndexNow(slug: string): Promise<boolean> {
  const url = `${SITE_URL}/blog/${slug}`;

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: [url],
      }),
    });

    console.log(`  IndexNow: requested for ${url} (status: ${res.status})`);
    return res.status === 200 || res.status === 202;
  } catch (error) {
    console.log(`  IndexNow failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}
