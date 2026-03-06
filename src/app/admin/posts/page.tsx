import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const supabase = getServiceClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title, status, published_at, category_id, primary_keyword, word_count')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name');

  const catMap = new Map(categories?.map((c) => [c.id, c.name]) ?? []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">포스트 관리</h1>
        <span className="text-sm text-gray-400">{posts?.length ?? 0}개</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">제목</th>
              <th className="hidden px-4 py-3 font-medium text-gray-500 md:table-cell">카테고리</th>
              <th className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">상태</th>
              <th className="hidden px-4 py-3 font-medium text-gray-500 lg:table-cell">글자수</th>
              <th className="px-4 py-3 font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(posts ?? []).map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                  <p className="text-xs text-gray-400">{post.primary_keyword}</p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="text-xs text-gray-500">{catMap.get(post.category_id) ?? '-'}</span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.status === 'published'
                        ? 'bg-green-50 text-green-700'
                        : post.status === 'draft'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {post.status === 'published' ? '발행' : post.status === 'draft' ? '임시' : '보관'}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="text-xs text-gray-400">{post.word_count?.toLocaleString() ?? '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                    >
                      편집
                    </Link>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="rounded-md bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                    >
                      보기
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
