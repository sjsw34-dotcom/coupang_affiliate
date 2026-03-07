#!/usr/bin/env tsx
/**
 * 기존 발행된 모든 포스트에 대해 Google Indexing API 색인 요청
 * Usage: npx tsx --env-file=.env.local scripts/index-all-posts.ts
 */
import { createClient } from '@supabase/supabase-js';
import { requestIndexing } from './lib/google-indexing';

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: posts, error } = await supabase
    .from('posts')
    .select('slug, title')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error || !posts) {
    console.error('Failed to fetch posts:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${posts.length} published posts\n`);

  let success = 0;
  for (const post of posts) {
    console.log(`[${success + 1}/${posts.length}] ${post.title}`);
    const ok = await requestIndexing(post.slug);
    if (ok) success++;
    // Rate limit: 200 requests/day, 간격 두기
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone: ${success}/${posts.length} indexed`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
