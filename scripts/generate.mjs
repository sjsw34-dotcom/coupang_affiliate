#!/usr/bin/env node
/**
 * Usage: node --env-file=.env.local scripts/generate.mjs <keyword> <slug> <category>
 * Example: node --env-file=.env.local scripts/generate.mjs "로봇청소기 추천 2025" best-robot-vacuum-2025 electronics
 *
 * Categories: electronics, car-accessories, camping-outdoor
 */

const [keyword, slug, category] = process.argv.slice(2);

if (!keyword || !slug || !category) {
  console.error('Usage: node --env-file=.env.local scripts/generate.mjs "<keyword>" <slug> <category>');
  console.error('Categories: electronics, car-accessories, camping-outdoor');
  process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const res = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ keyword, slug, category_slug: category }),
});

const data = await res.json();

if (data.ok) {
  console.log('Success!');
  console.log('  Post:', data.urls.post);
  console.log('  Collection:', data.urls.collection);
  console.log('  Products:', data.products_count);
} else {
  console.error('Error:', data.error);
  if (data.details) console.error('Details:', data.details);
  process.exit(1);
}
