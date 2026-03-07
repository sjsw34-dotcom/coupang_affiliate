/**
 * Google Indexing API — 새 포스트 발행 시 자동 색인 요청
 */
import { google } from 'googleapis';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chulmall.com';

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
  }
  const credentials = JSON.parse(json);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

export async function requestIndexing(slug: string): Promise<boolean> {
  const url = `${SITE_URL}/blog/${slug}`;
  try {
    const auth = getAuth();
    const client = await auth.getClient();
    const res = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: {
        url,
        type: 'URL_UPDATED',
      },
    });
    console.log(`  Google Indexing: requested for ${url} (status: ${res.status})`);
    return true;
  } catch (error) {
    console.log(`  Google Indexing failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    return false;
  }
}
