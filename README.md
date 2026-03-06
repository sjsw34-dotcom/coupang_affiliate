# Coupang Affiliate Site

Google-first SEO 제휴 마케팅 사이트. Next.js (App Router) + Supabase + Vercel.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Supabase (Postgres)
- Vercel 배포

## 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=추천가이드
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## DB 마이그레이션 실행

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트 생성
2. 좌측 메뉴 **SQL Editor** 클릭
3. `supabase/migrations/001_init.sql` 파일의 전체 내용을 복사하여 실행
4. (선택) `supabase/seed.sql` 파일로 샘플 데이터 삽입

또는 Supabase CLI 사용:

```bash
# Supabase CLI 설치 후
supabase db push
```

## 개발 서버

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.

## 주요 명령어

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm run typecheck  # TypeScript 타입 체크
npm run lint       # ESLint
```

## 프로젝트 구조

```
src/
  app/           # Next.js App Router 페이지
  components/    # UI 컴포넌트
    layout/      # Header, Footer
    ui/          # 재사용 가능한 UI 컴포넌트
  lib/           # 유틸리티, DB 클라이언트, 타입
supabase/
  migrations/    # SQL 마이그레이션 파일
  seed.sql       # 샘플 데이터
```
