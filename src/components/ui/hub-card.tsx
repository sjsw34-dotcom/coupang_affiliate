import Link from 'next/link';
import type { Hub } from '@/lib/types';

interface HubCardProps {
  hub: Pick<Hub, 'title' | 'slug' | 'meta_description'>;
}

export default function HubCard({ hub }: HubCardProps) {
  return (
    <div className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-semibold uppercase text-blue-500">관련 가이드</p>
      <p className="mt-1 font-semibold text-gray-900">{hub.title}</p>
      {hub.meta_description && (
        <p className="mt-1 text-sm text-gray-600">{hub.meta_description}</p>
      )}
      <Link
        href={`/h/${hub.slug}`}
        className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        더 알아보기 →
      </Link>
    </div>
  );
}
