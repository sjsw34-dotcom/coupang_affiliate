import Image from 'next/image';

interface AuthorBoxProps {
  author_name: string;
  author_bio: string | null;
  author_image_url: string | null;
}

export default function AuthorBox({ author_name, author_bio, author_image_url }: AuthorBoxProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author_name,
    description: author_bio,
    image: author_image_url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mt-8 flex items-center gap-4 rounded-lg border border-gray-200 p-4">
        {author_image_url ? (
          <Image
            src={author_image_url}
            alt={author_name}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500">
            {author_name[0]}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{author_name}</p>
          {author_bio && <p className="text-sm text-gray-500">{author_bio}</p>}
        </div>
      </div>
    </>
  );
}
