import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/best`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/deals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${SITE_URL}/disclaimer`, changeFrequency: 'monthly', priority: 0.2 },
  ];

  try {
    // Posts
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published');

    if (posts) {
      for (const post of posts) {
        entries.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at ?? post.published_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Collections
    const { data: collections } = await supabase
      .from('collections')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (collections) {
      for (const col of collections) {
        entries.push({
          url: `${SITE_URL}/l/${col.slug}`,
          lastModified: col.updated_at ? new Date(col.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    // Hubs
    const { data: hubs } = await supabase
      .from('hubs')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (hubs) {
      for (const hub of hubs) {
        entries.push({
          url: `${SITE_URL}/h/${hub.slug}`,
          lastModified: hub.updated_at ? new Date(hub.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    // Categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug');

    if (categories) {
      for (const cat of categories) {
        entries.push({
          url: `${SITE_URL}/c/${cat.slug}`,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch {
    // Return static entries only if Supabase is unavailable
  }

  return entries;
}
