import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = getServiceClient();

  const [postsRes, productsRes, collectionsRes] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact' }),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('collections').select('id', { count: 'exact' }).eq('status', 'published'),
  ]);

  const stats = [
    { label: '포스트', count: postsRes.count ?? 0, href: '/admin/posts' },
    { label: '상품', count: productsRes.count ?? 0, href: '#' },
    { label: '컬렉션', count: collectionsRes.count ?? 0, href: '#' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.count}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
