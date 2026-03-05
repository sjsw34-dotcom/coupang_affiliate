import Link from 'next/link';

interface CollectionCTACardProps {
  collection: {
    title: string;
    slug: string;
    meta_description: string | null;
  };
}

export default function CollectionCTACard({ collection }: CollectionCTACardProps) {
  return (
    <div className="my-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-5">
      <p className="text-xs font-semibold uppercase text-orange-600">추천 리스트</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{collection.title}</p>
      {collection.meta_description && (
        <p className="mt-1 text-sm text-gray-600">{collection.meta_description}</p>
      )}
      <Link
        href={`/l/${collection.slug}`}
        className="mt-3 inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
      >
        추천 리스트 보기
      </Link>
    </div>
  );
}
