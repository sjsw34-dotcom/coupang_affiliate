export default function BlogPostLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Breadcrumb */}
      <div className="mb-4 h-4 w-48 rounded bg-gray-100" />

      {/* Title */}
      <div className="h-5 w-3/4 rounded bg-gray-100" />
      <div className="mt-2 h-8 w-full rounded bg-gray-200" />
      <div className="mt-1 h-8 w-2/3 rounded bg-gray-200" />

      {/* Meta */}
      <div className="mt-3 h-4 w-40 rounded bg-gray-100" />

      {/* Hero image */}
      <div className="mt-5 aspect-video w-full rounded-2xl bg-gray-200" />

      {/* Content skeleton */}
      <div className="mt-8 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-gray-100"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}
