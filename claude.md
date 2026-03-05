# Project Overview

Build a Google-first SEO affiliate site using Next.js (App Router) + Supabase + Vercel.
Target: Korean male audience with shopping intent for:
- Electronics (가전/IT)
- Vehicles / car accessories (자동차/용품)
- Camping / outdoor gear (캠핑/아웃도어)

Monetization:
- Coupang Partners affiliate links (prefer search links + a few product links)

Primary goals:
1) Publish SEO pages (2 posts/day automation later)
2) Increase CTR & conversion via Hub/List/Review funnel
3) Keep the site fast, clean, and indexable by Google
4) Build E-E-A-T signals for long-term Google trust

---

# Tech Stack

Frontend:
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- next/font (Pretendard or Noto Sans KR)

Backend/Data:
- Supabase (Postgres + Row Level Security)
- Supabase Edge Functions (optional)
- Vercel Cron (Phase 2)

Deployment:
- Vercel

---

# Performance Targets

- Mobile-first responsive (breakpoints: 375, 768, 1280)
- Core Web Vitals:
  - LCP < 2.5s
  - CLS < 0.1
  - INP < 200ms
- Lighthouse score target: 90+ (Performance, SEO)
- Use next/font for web fonts
- Image: WebP via next/image, lazy loading, proper width/height
- Server Components by default, minimal client JS
- No heavy client-side state libraries

---

# Keyword Strategy

## Keyword Selection Criteria
Target purchase-intent keywords only. Every post must target ONE primary keyword.

Keyword tiers:
- Tier 1 (Head): "[카테고리] 추천" (e.g., 캠핑의자 추천) — high volume, high competition
- Tier 2 (Mid): "[제품군] 추천 [연도/조건]" (e.g., 차량용 공기청정기 추천 2025) — medium volume, medium competition
- Tier 3 (Long-tail): "[구체조건] [제품] 추천" (e.g., 150kg 지지 경량 캠핑의자) — low volume, low competition, HIGH conversion

## Content Priority by Keyword Tier
- Phase 1 (MVP): Focus on Tier 3 long-tail keywords (easier to rank, faster results)
- Phase 2: Scale to Tier 2 mid-tail keywords
- Phase 3: Compete for Tier 1 head keywords (requires domain authority)

## Keyword Rules for Content Generation
- Primary keyword MUST appear in: title, meta description, h1, first paragraph, 1–2 h2s, URL slug
- Secondary keywords (2–3): naturally placed in body, h2/h3 headings
- Keyword density: 1–2% for primary keyword (natural, not stuffed)
- Related search terms: include "People Also Ask" style questions in FAQ section
- NEVER target the same primary keyword in two different posts (cannibalization)

## Keyword Mapping to Page Types
- Blog posts: Tier 2–3 informational + transactional keywords
- List pages (/l/): Tier 1–2 "추천", "비교", "순위" keywords
- Hub pages (/h/): Tier 1 broad category keywords
- Deals page: "할인", "세일", "최저가" keywords

---

# Content Template Structure

## Blog Post Template (Affiliate Review/Recommendation)

Every blog post MUST follow this structure for consistent quality and conversion:

```
### [H1] {Primary Keyword} — {Year} {Benefit/Hook}
Example: "차량용 공기청정기 추천 — 2025년 미세먼지 시즌 완벽 대비"

### 도입부 (Introduction) — 150~200자
- Problem statement: 독자의 고민/상황 공감
- Promise: 이 글에서 얻을 수 있는 것
- Primary keyword 자연 삽입

### [H2] 선정 기준 (Selection Criteria) — 200~300자
- 3–5가지 객관적 평가 기준 제시
- 왜 이 기준이 중요한지 간단 설명
- 신뢰도 확보: "직접 비교 분석", "스펙 기반 평가" 등

### [H2] 추천 제품 비교 (Product Comparison) — 본문 핵심, 600~800자
- ComparisonTable 컴포넌트 삽입
- 제품별 소개 (각 150~200자):
  - 핵심 장점 1–2개
  - 주의할 점 1개
  - 어떤 사람에게 적합한지
- [Auto-inject] HubCard after 2nd H2

### [H2] 최종 추천 (Final Pick) — 150~200자
- Top 1 추천 + 이유 (명확한 근거)
- 상황별 추천 (가성비 / 프리미엄 / 입문용)
- CTAButton (primary) 삽입

### [H2] 자주 묻는 질문 (FAQ) — 3~5개 Q&A
- FAQAccordion 컴포넌트
- "People Also Ask" 스타일 질문
- 각 답변 50~100자

### 결론 (Conclusion) — 100~150자
- 핵심 요약 한 줄
- [Auto-inject] CollectionCTACard
- AffiliateDisclosure 컴포넌트
```

Total target: 1,200~1,600자 (Korean characters)

## List Page Template (/l/[slug])

```
### [H1] {카테고리} TOP {N} 추천 — {Year}
- 짧은 도입부 (100자)
- 선정 기준 요약 (3줄)
- 순위별 ProductCard (rank 1 = highlighted)
- 각 제품: 한줄평 + CTAButton
- ComparisonTable (전체 비교)
- FAQ (3개)
- AffiliateDisclosure
```

## Hub Page Template (/h/[slug])

```
### [H1] {주제} 완벽 가이드
- 주제 개요 (200자)
- 관련 컬렉션 카드 (2–4개 List pages)
- 관련 블로그 포스트 그리드 (6–12개)
- FAQ (3–5개)
```

---

# Google E-E-A-T Compliance

## Why This Matters
Affiliate/review sites are classified as "Your Money or Your Life" (YMYL) adjacent by Google.
Low E-E-A-T = suppressed rankings regardless of technical SEO quality.

## Required Trust Pages (Phase 1)
- /about — 사이트 소개 + 운영 목적 + 리뷰 철학
  - "저희는 직접 스펙을 비교하고 사용자 리뷰를 분석하여 추천합니다"
  - 운영자 소개 (이름 or 닉네임 + 전문 분야)
  - 연락처 (이메일)
- /privacy — 개인정보처리방침 (간단한 한국어 버전)
- /disclaimer — 제휴 마케팅 고지 + 리뷰 기준 투명 공개

## Author/Reviewer Profile
- posts table has: author_name, author_bio, author_image_url
- Display author box at top or bottom of every blog post
- Schema.org Person markup for author
- Consistent author identity across all posts

## Content Credibility Signals
- Every recommendation MUST include objective criteria (specs, measurements, data)
- Include "선정 기준" section in every post explaining HOW products were evaluated
- Show both pros AND cons for every product (never 100% positive)
- Date every post (published_at visible to users, not just schema)
- "최종 업데이트: YYYY.MM.DD" visible on post pages
- Cite sources when referencing external data (official specs, user reviews count, etc.)

## Structural E-E-A-T Signals
- Breadcrumb navigation on all content pages (BreadcrumbList schema)
- Clear site hierarchy: Home → Category → Content
- Footer: About, Privacy, Disclaimer, Contact links
- HTTPS (Vercel default)
- No aggressive popups or interstitials

---

# Site Architecture (Conversion Funnel)

Do NOT build as blog-only.
Use these page types:

1) Home: shopping-like curated layout (featured collections + latest posts)
2) Category page: grid of posts/collections filtered by category
3) Blog posts: SEO traffic engine (long-form content)
4) Hub pages (/h/[slug]): topic hubs (internal link center)
5) List pages (/l/[slug]): "Top picks" collections (conversion pages)
6) Best page (/best): top content ranked by click/outbound events
7) Deals page (/deals): curated deals/editor picks (manual first)
8) Trust pages: /about, /privacy, /disclaimer

Traffic flow:
Google → Blog/Hub → List → Outbound (Coupang) → Purchase

Internal linking rules:
- Every blog post MUST link to:
  - 1 Hub page
  - 1 List/Collection page
- Hubs surface 2–4 lists + 6–12 related posts
- Lists highlight Top 1–3 and contain 2–3 CTAs

Internal linking implementation:
- posts table has: hub_id (FK), primary_collection_id (FK)
- On post render, auto-inject:
  - Related hub card component (after 2nd h2 heading)
  - Collection CTA card component (before conclusion section)
- Hub pages: auto-query posts WHERE hub_id = this.id (limit 12, order by published_at DESC)
- Collection pages: join collection_products, render ranked product cards

---

# Routes

Public:
- /                        Home
- /c/[slug]                Category
- /blog                    Blog index (paginated)
- /blog/[slug]             Blog post detail
- /h/[slug]                Hub
- /l/[slug]                Collection/List
- /best                    Best (from events)
- /deals                   Deals (manual curated)
- /about                   About (E-E-A-T)
- /privacy                 Privacy Policy
- /disclaimer              Disclaimer + Affiliate Disclosure
- /sitemap.xml             Dynamic sitemap
- /robots.txt              Robots

Admin (protected by secret header or basic auth):
- /admin                   Dashboard
- /admin/posts             Post CRUD
- /admin/collections       Collection CRUD
- /admin/products          Product CRUD

API:
- /api/events              Track click/outbound (POST)
- /api/cron/daily-generate (Phase 2, Vercel Cron)

---

# Coupang Partners Integration

## Link Strategy
Prefer "search links" to reduce out-of-stock risk and increase conversion:
- CTA #1: Search link for main keyword
- CTA #2: Search link for refined keyword (e.g., "경량", "150kg", "저소음", "가성비")
- Optionally add 1–2 specific product links if available

## Link Format
- Shortened affiliate link: https://link.coupang.com/a/XXXXXX
- Direct search link: https://www.coupang.com/np/search?component=&q={keyword}&channel=user
- All affiliate links stored in DB (products.affiliate_url) — NEVER hardcode in templates
- Links pulled from DB at render time

## CTA Rules
- 2–4 CTAs per page max (avoid link spam)
- CTA button copy (avoid "buy" / "구매"):
  - 오늘 가격 확인하기
  - 쿠팡에서 검색결과 보기
  - 최저가 비교하기
  - 할인 여부 확인하기
- All CTA links: rel="nofollow noopener sponsored" + target="_blank"

## Disclosure
- Add affiliate disclosure block at bottom of every post and list page:
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."

---

# SEO Rules (Google-first, Non-negotiable)

## Meta & Structured Data
- Use generateMetadata() for every dynamic page
- Canonical URL on every page
- OG + Twitter meta tags
- JSON-LD per page type:
  - Blog post: Article + FAQPage + BreadcrumbList + Person (author)
  - List page: ItemList + FAQPage + BreadcrumbList
  - Hub page: CollectionPage + BreadcrumbList
  - Home: WebSite + Organization
  - About: AboutPage + Person/Organization

## Korean SEO Specifics
- html lang="ko"
- <link rel="alternate" hreflang="ko-KR" />
- Meta description: 80–120자 (Korean characters)
- Title tag: 30–45자
- URL slug: English transliteration (e.g., /blog/best-camping-chair-2025)
- Naver site verification meta tag (optional, Phase 2)
- Structured data: Korean language values where applicable

## Sitemap & Robots
- /sitemap.xml: include all published pages, auto-generate
- /robots.txt:
  - Allow: /
  - Disallow: /admin, /api
  - Sitemap: https://{domain}/sitemap.xml

## Content Quality
- No thin pages (minimum ~1,200–1,600자 for posts)
- No duplicate templates repeated verbatim
- Unique meta description per page
- Every image has descriptive alt text (Korean)
- Use next/image for all images
- Every post shows published date and last updated date

---

# Data Model (Supabase)

## categories
- id: uuid (PK, default gen_random_uuid())
- slug: text (unique, not null)
- name: text (not null)
- description: text
- thumbnail_url: text
- sort_order: int (default 0)
- created_at: timestamptz (default now())

## products
- id: uuid (PK, default gen_random_uuid())
- name: text (not null)
- brand: text
- category_id: uuid (FK → categories.id)
- image_url: text
- price: int (KRW, nullable — prices change)
- rating: numeric(2,1)
- affiliate_url: text (not null)
- affiliate_type: text ('search' | 'product')
- search_keyword: text (for search links)
- badge: text (nullable, e.g., '에디터 추천', '가성비 최고')
- pros: text[] (array)
- cons: text[] (array)
- is_active: boolean (default true)
- created_at: timestamptz (default now())
- updated_at: timestamptz

## posts
- id: uuid (PK, default gen_random_uuid())
- slug: text (unique, not null)
- title: text (not null)
- meta_description: text (80–120자)
- category_id: uuid (FK → categories.id)
- hub_id: uuid (FK → hubs.id, nullable)
- primary_collection_id: uuid (FK → collections.id, nullable)
- content: text (markdown)
- excerpt: text
- thumbnail_url: text
- status: text ('draft' | 'published' | 'archived', default 'draft')
- published_at: timestamptz
- updated_at: timestamptz
- created_at: timestamptz (default now())
- word_count: int
- reading_time_min: int
- faq_json: jsonb (array of {question, answer} for FAQPage schema)
- primary_keyword: text (not null — the target keyword for this post)
- secondary_keywords: text[] (2–3 related keywords)
- author_name: text (default '에디터')
- author_bio: text
- author_image_url: text

## post_products
- id: uuid (PK)
- post_id: uuid (FK → posts.id, ON DELETE CASCADE)
- product_id: uuid (FK → products.id)
- display_order: int
- context_note: text (optional, why this product is mentioned)

## collections
- id: uuid (PK, default gen_random_uuid())
- slug: text (unique, not null)
- title: text (not null)
- meta_description: text
- description: text (markdown)
- category_id: uuid (FK → categories.id)
- thumbnail_url: text
- status: text ('draft' | 'published', default 'draft')
- published_at: timestamptz
- created_at: timestamptz (default now())
- updated_at: timestamptz
- faq_json: jsonb

## collection_products
- id: uuid (PK)
- collection_id: uuid (FK → collections.id, ON DELETE CASCADE)
- product_id: uuid (FK → products.id)
- rank: int (1 = top pick)
- pick_label: text (nullable, e.g., '최고 추천', '가성비 1위')
- mini_review: text

## hubs
- id: uuid (PK, default gen_random_uuid())
- slug: text (unique, not null)
- title: text (not null)
- meta_description: text
- description: text (markdown)
- category_id: uuid (FK → categories.id)
- thumbnail_url: text
- status: text ('draft' | 'published', default 'draft')
- created_at: timestamptz (default now())
- updated_at: timestamptz

## hub_links
- id: uuid (PK)
- hub_id: uuid (FK → hubs.id, ON DELETE CASCADE)
- target_type: text ('post' | 'collection')
- target_id: uuid
- display_order: int
- label: text (optional override label)

## events
- id: uuid (PK, default gen_random_uuid())
- type: text ('click' | 'outbound' | 'cta_view')
- page_slug: text (not null)
- target_url: text
- product_id: uuid (FK → products.id, nullable)
- position: int (CTA position on page)
- user_agent: text
- referer: text
- created_at: timestamptz (default now())

## daily_jobs (Phase 2)
- id: uuid (PK)
- job_type: text ('post_generate' | 'sitemap_refresh')
- status: text ('pending' | 'running' | 'done' | 'failed')
- result_json: jsonb
- created_at: timestamptz (default now())
- completed_at: timestamptz

## keyword_tracker (Phase 2 — prevent cannibalization)
- id: uuid (PK)
- keyword: text (unique, not null)
- post_id: uuid (FK → posts.id)
- search_volume_est: int (nullable)
- competition: text ('low' | 'medium' | 'high')
- created_at: timestamptz (default now())

### Indexes
- posts: idx_posts_slug (unique), idx_posts_status_published (status, published_at DESC), idx_posts_primary_keyword (primary_keyword, unique where status='published')
- products: idx_products_category (category_id), idx_products_active (is_active)
- events: idx_events_type_created (type, created_at DESC), idx_events_page (page_slug)
- collections: idx_collections_slug (unique)
- hubs: idx_hubs_slug (unique)
- keyword_tracker: idx_keyword_unique (keyword, unique)

---

# Component Specs

## ProductCard
- Props: product { name, image_url, price?, rating?, affiliate_url, badge?, brand? }
- Layout: vertical card (image top 16:9 aspect, info bottom)
- Show: badge (if exists), name, brand, price (formatted ₩), rating stars
- CTA: "오늘 가격 확인" button → affiliate_url
- On CTA click: fire event { type: 'outbound', product_id, page_slug }
- Must use next/image with proper width/height, lazy load
- Hover: subtle shadow elevation

## CTAButton
- Props: href, label, variant ('primary' | 'secondary' | 'outline'), productId?, pageSlug?
- Primary: bold, Coupang-orange (#F05A28) or brand blue, full-width on mobile
- Secondary: outlined, smaller
- On click: fire POST /api/events with { type: 'outbound', target_url, product_id, page_slug }
- Use navigator.sendBeacon() for outbound events (prevents data loss on navigation)
- All links: rel="nofollow noopener sponsored" target="_blank"

## ComparisonTable
- Props: products[], columns[] (e.g., ['제품명', '무게', '가격대', '평점'])
- Responsive: horizontal scroll wrapper on mobile
- Highlight row with rank=1 (subtle background color)
- Each row has mini CTA button (compact "확인" link)
- Sticky first column on mobile scroll

## FAQAccordion
- Props: items[] { question: string, answer: string }
- Accessible: button role, aria-expanded, aria-controls
- Auto-generates FAQPage JSON-LD from items (passed to page head)
- Smooth expand/collapse animation (CSS only, no JS animation lib)

## HubCard (inline in posts)
- Props: hub { title, slug, description, thumbnail_url }
- Compact horizontal card layout
- "더 알아보기 →" text link
- Used: auto-injected after 2nd h2 in blog posts

## CollectionCTACard (inline in posts)
- Props: collection { title, slug, description, product_count }
- Prominent card with accent border
- "추천 리스트 보기" button
- Used: auto-injected before conclusion in blog posts

## AuthorBox
- Props: { author_name, author_bio, author_image_url }
- Compact horizontal layout: avatar (48px circle) + name + bio
- Displayed at bottom of every blog post
- Schema.org Person markup embedded

## AffiliateDisclosure
- Static component, no props
- Fixed text: "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
- Subtle gray text, small font, bottom of post/list pages

## Breadcrumb
- Props: items[] { label, href }
- Schema.org BreadcrumbList JSON-LD
- Show on: blog posts, hub pages, list pages, category pages

## PostMeta
- Props: { published_at, updated_at, reading_time_min, author_name }
- Display: "2025.03.05 작성 · 2025.03.05 업데이트 · 5분 읽기"
- Placed below H1, above content

---

# Event Tracking

## API Endpoint
POST /api/events
Content-Type: application/json

Request body:
{
  type: 'click' | 'outbound' | 'cta_view',
  page_slug: string,
  target_url?: string,
  product_id?: string,
  position?: number
}

## Implementation Rules
- Use navigator.sendBeacon() for outbound events (user is leaving the page)
- Use fetch() for click and cta_view events
- Client-side: thin wrapper function `trackEvent(type, data)`
- Server-side: validate with zod, insert to events table
- No external analytics dependency in Phase 1
- Rate limit: basic IP-based throttle (optional)

---

# Environment Variables

Required in .env.local:
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=사이트명
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Optional (Phase 2):
```
COUPANG_PARTNERS_ACCESS_KEY=
COUPANG_PARTNERS_SECRET_KEY=
CRON_SECRET=  (for securing /api/cron endpoints)
ADMIN_SECRET=  (for protecting /admin routes)
```

---

# Development Priority

## Phase 1: MVP
1) Setup Next.js project + Tailwind + TypeScript strict
2) Configure next/font (Pretendard)
3) Add Supabase client (server-side only for data fetching)
4) Run DB migration: all tables + indexes
5) Seed sample data: 3 categories, 5 products, 3 posts, 1 hub, 1 collection
6) Implement layouts: RootLayout (header, footer with trust links, nav)
7) Implement trust pages: /about, /privacy, /disclaimer
8) Implement routes:
   - / (Home)
   - /c/[slug] (Category)
   - /blog (Blog index with pagination)
   - /blog/[slug] (Blog post with auto-injected hub/collection cards + AuthorBox + PostMeta)
   - /h/[slug] (Hub)
   - /l/[slug] (List/Collection)
   - /best (ranked by events)
   - /deals (manual curated)
9) Implement components: ProductCard, CTAButton, ComparisonTable, FAQAccordion, HubCard, CollectionCTACard, AuthorBox, PostMeta, AffiliateDisclosure, Breadcrumb
10) Implement SEO: generateMetadata, JSON-LD (Article, FAQPage, ItemList, BreadcrumbList, Person, Organization), sitemap.xml, robots.txt
11) Implement /api/events + client trackEvent utility
12) Deploy to Vercel, verify Google Search Console

## Phase 2: Admin + Automation
- Admin pages for Post/Collection/Product CRUD
- Daily cron: auto-generate 2 posts/day (Claude API or manual queue)
- keyword_tracker table: prevent keyword cannibalization
- Internal-link automation improvements
- Naver Search Advisor registration
- /best page: auto-rank by real event data

## Phase 3: Optimization
- A/B test CTA copy and placement
- Add scroll-depth tracking
- Refine /deals with seasonal/event-based curation
- Image CDN optimization
- Consider ISR (Incremental Static Regeneration) for high-traffic pages
- Expand author profiles for multi-author E-E-A-T
- Google Analytics 4 integration (optional)

---

# Execution Rules (for Claude Code)

- Always read this entire claude.md before starting any task.
- Execute ONLY the specific STEP requested. Do NOT jump ahead.
- After completing a step, verify it works (build check, page render, etc.) before reporting done.
- If a step depends on a previous step's output, check that the dependency exists first.
- When creating files, always check if the file already exists to avoid overwriting.
- When importing from other files, verify the import path and exported names are correct.
- If you encounter an error, fix it within the current step before moving on.
- Always use the types defined in src/lib/types.ts — do not create duplicate type definitions.
- Every component must match the Props and behavior defined in the Component Specs section above.

---

# Coding Standards

- TypeScript strict mode (no any)
- Prefer server components and server-side data fetching
- Client components only when interactivity is required (mark with 'use client')
- Keep files small and focused (< 200 lines preferred)
- Use zod for API input validation
- Supabase queries: always select specific columns, never select *
- Error boundaries on dynamic pages
- Consistent naming: camelCase for variables, PascalCase for components, kebab-case for files
- Git commit messages: conventional commits (feat:, fix:, chore:)