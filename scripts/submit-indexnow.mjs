/**
 * 기존 포스트 전체를 IndexNow에 일괄 제출
 * Usage: node --env-file=.env.local scripts/submit-indexnow.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://chulmall.com';
const KEY = '23df5e8b43a848cfa5d125719fde0332';

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await s.from('posts').select('slug').eq('status', 'published');
if (!data || data.length === 0) {
  console.log('No posts found');
  process.exit(0);
}

const urls = data.map(p => `${SITE_URL}/blog/${p.slug}`);
urls.push(SITE_URL, `${SITE_URL}/blog`);

console.log(`Submitting ${urls.length} URLs to IndexNow...`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    host: 'chulmall.com',
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: urls,
  }),
});

console.log(`Status: ${res.status} ${res.statusText}`);
if (res.status === 200 || res.status === 202) {
  console.log('Done! All URLs submitted to Naver, Bing, Yandex.');
} else {
  console.log('Body:', await res.text());
}
