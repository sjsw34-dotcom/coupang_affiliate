import { getServiceClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = getServiceClient();

  const [postRes, categoriesRes, hubsRes, collectionsRes] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('hubs').select('id, title').eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('collections').select('id, title').eq('status', 'published').order('created_at', { ascending: false }),
  ]);

  if (!postRes.data) {
    notFound();
  }

  const post = postRes.data;

  return (
    <PostEditor
      post={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        meta_description: post.meta_description ?? '',
        content: post.content?.replace(/<!--TEMPLATE:[\s\S]*?-->\n?/, '') ?? '',
        excerpt: post.excerpt ?? '',
        status: post.status ?? 'draft',
        primary_keyword: post.primary_keyword ?? '',
        secondary_keywords: post.secondary_keywords ?? [],
        author_name: post.author_name ?? '에디터',
        author_bio: post.author_bio ?? '',
        category_id: post.category_id ?? '',
        hub_id: post.hub_id ?? '',
        primary_collection_id: post.primary_collection_id ?? '',
        thumbnail_url: post.thumbnail_url ?? '',
        faq_json: post.faq_json ?? [],
      }}
      categories={categoriesRes.data ?? []}
      hubs={hubsRes.data ?? []}
      collections={collectionsRes.data ?? []}
    />
  );
}
