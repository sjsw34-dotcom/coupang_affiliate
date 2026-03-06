import { getServiceClient } from '@/lib/supabase';
import PostEditor from '@/components/admin/PostEditor';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const supabase = getServiceClient();

  const [categoriesRes, hubsRes, collectionsRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('hubs').select('id, title').eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('collections').select('id, title').eq('status', 'published').order('created_at', { ascending: false }),
  ]);

  return (
    <PostEditor
      isNew
      categories={categoriesRes.data ?? []}
      hubs={hubsRes.data ?? []}
      collections={collectionsRes.data ?? []}
    />
  );
}
