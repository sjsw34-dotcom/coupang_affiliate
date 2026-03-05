import Link from 'next/link';
import { SITE_NAME, NAV_ITEMS, CATEGORIES } from '@/lib/constants';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {/* Category bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 overflow-x-auto px-4 py-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/c/${cat.slug}`}
              className="whitespace-nowrap text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
