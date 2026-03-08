export default function BlogLoading() {
  return (
    <div>
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-5 w-48 animate-pulse rounded bg-gray-100" />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
            <div className="aspect-video animate-pulse bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
