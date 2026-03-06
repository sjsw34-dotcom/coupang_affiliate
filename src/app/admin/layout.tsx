import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple secret-based auth via cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

  if (token !== secret) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-bold text-gray-900">
              Admin
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                대시보드
              </Link>
              <Link href="/admin/posts" className="text-sm text-gray-600 hover:text-gray-900">
                포스트
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            사이트 보기 →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
