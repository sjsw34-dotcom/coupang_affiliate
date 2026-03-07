import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPublishedPosts, getCategoryById } from '@/lib/queries';
import { SITE_URL } from '@/lib/constants';
import type { Category } from '@/lib/types';

const PER_PAGE = 12;

export const revalidate = 600; // ISR: 10분마다 갱신

export const metadata: Metadata = {
  title: '추천 리뷰 블로그',
  description: '가전, 자동차용품, 캠핑장비 추천 리뷰 모음 | 실사용 비교 분석, 구매 가이드, 최저가 정보를 확인하세요',
  alternates: { canonical: `${SITE_URL}/blog` },
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndex({ searchParams }: Props) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const offset = (currentPage - 1) * PER_PAGE;

  const { posts, total } = await getPublishedPosts(PER_PAGE, offset);
  const totalPages = Math.ceil(total / PER_PAGE);

  // Fetch categories for each post
  const categoryIds = [...new Set(posts.map((p) => p.category_id))];
  const categories = await Promise.all(categoryIds.map((id) => getCategoryById(id)));
  const categoryMap = new Map<string, Category>();
  for (const cat of categories) {
    if (cat) categoryMap.set(cat.id, cat);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">블로그</h1>
      <p className="mt-2 text-gray-500">추천 리뷰와 비교 분석 글</p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => {
          const category = categoryMap.get(post.category_id);
          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {post.thumbnail_url ? (
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    {category?.name || '리뷰'}
                  </div>
                )}
                {category && (
                  <span className="absolute left-2 top-2 rounded bg-gray-900/70 px-2 py-0.5 text-xs text-white">
                    {category.name}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span>{post.author_name}</span>
                  <span>·</span>
                  <span>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('ko-KR')
                      : ''}
                  </span>
                  {post.reading_time_min && <span>· {post.reading_time_min}분 읽기</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 && (
        <p className="mt-8 text-center text-gray-400">아직 게시된 글이 없습니다.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="페이지 네비게이션">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              이전
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/blog?page=${p}`}
              className={`rounded px-3 py-2 text-sm ${
                p === currentPage
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              다음
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
