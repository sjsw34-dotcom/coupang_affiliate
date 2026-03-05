interface PostMetaProps {
  published_at: string | null;
  updated_at: string | null;
  reading_time_min: number | null;
  author_name: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function PostMeta({
  published_at,
  updated_at,
  reading_time_min,
  author_name,
}: PostMetaProps) {
  const parts: string[] = [];
  if (published_at) parts.push(`${formatDate(published_at)} 작성`);
  if (updated_at) parts.push(`${formatDate(updated_at)} 업데이트`);
  if (reading_time_min) parts.push(`${reading_time_min}분 읽기`);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
      <span>{author_name}</span>
      {parts.length > 0 && <span>·</span>}
      <span>{parts.join(' · ')}</span>
    </div>
  );
}
