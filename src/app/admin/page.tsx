import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = getServiceClient();

  const [postsRes, publishedRes, draftRes, productsRes, collectionsRes, recentPostsRes, eventsRes] =
    await Promise.all([
      supabase.from('posts').select('id', { count: 'exact' }),
      supabase.from('posts').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase.from('posts').select('id', { count: 'exact' }).eq('status', 'draft'),
      supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('collections').select('id', { count: 'exact' }).eq('status', 'published'),
      supabase
        .from('posts')
        .select('id, title, slug, status, created_at, primary_keyword')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('events')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

  const stats = [
    { label: '전체 포스트', count: postsRes.count ?? 0, href: '/admin/posts' },
    { label: '발행됨', count: publishedRes.count ?? 0, href: '/admin/posts', color: 'text-green-600' },
    { label: '임시저장', count: draftRes.count ?? 0, href: '/admin/posts', color: 'text-yellow-600' },
    { label: '활성 상품', count: productsRes.count ?? 0, href: '#' },
    { label: '컬렉션', count: collectionsRes.count ?? 0, href: '#' },
    { label: '7일 이벤트', count: eventsRes.count ?? 0, href: '#' },
  ];

  const recentPosts = recentPostsRes.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 새 글 작성
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color ?? 'text-gray-900'}`}>{s.count}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-lg">
              +
            </span>
            <div>
              <p className="font-medium text-gray-900">새 포스트</p>
              <p className="text-xs text-gray-500">새 블로그 글 작성</p>
            </div>
          </Link>
          <Link
            href="/admin/posts"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-lg">
              =
            </span>
            <div>
              <p className="font-medium text-gray-900">포스트 관리</p>
              <p className="text-xs text-gray-500">편집, 발행, 삭제</p>
            </div>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-lg">
              @
            </span>
            <div>
              <p className="font-medium text-gray-900">사이트 보기</p>
              <p className="text-xs text-gray-500">실제 사이트 확인</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">최근 포스트</h2>
          <Link href="/admin/posts" className="text-sm text-blue-600 hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {recentPosts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              포스트가 없습니다.{' '}
              <Link href="/admin/posts/new" className="text-blue-600 hover:underline">
                첫 글을 작성해보세요
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{post.title}</p>
                      <p className="text-xs text-gray-400">
                        {post.primary_keyword} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span
                      className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {post.status === 'published' ? '발행' : '임시'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
