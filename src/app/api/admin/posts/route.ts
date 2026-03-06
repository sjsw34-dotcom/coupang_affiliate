import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  return token === secret;
}

// GET: fetch single post by id, or list posts
export async function GET(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  const supabase = getServiceClient();

  if (id) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  }

  // List mode
  const status = req.nextUrl.searchParams.get('status');
  let query = supabase
    .from('posts')
    .select('id, slug, title, status, published_at, category_id, primary_keyword, word_count, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: create new post
export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, slug, content, primary_keyword, category_id } = body;

  if (!title || !slug || !content || !primary_keyword || !category_id) {
    return NextResponse.json(
      { error: 'Missing required fields: title, slug, content, primary_keyword, category_id' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const insert = {
    title,
    slug,
    content,
    primary_keyword,
    category_id,
    meta_description: body.meta_description ?? null,
    excerpt: body.excerpt ?? null,
    status: body.status ?? 'draft',
    secondary_keywords: body.secondary_keywords ?? null,
    author_name: body.author_name ?? '에디터',
    author_bio: body.author_bio ?? null,
    hub_id: body.hub_id || null,
    primary_collection_id: body.primary_collection_id || null,
    thumbnail_url: body.thumbnail_url || null,
    faq_json: body.faq_json ?? null,
    word_count: body.word_count ?? null,
    reading_time_min: body.reading_time_min ?? null,
    published_at: body.status === 'published' ? now : null,
    created_at: now,
    updated_at: now,
  };

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('posts')
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

// PUT: update post
export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // Convert empty strings to null for FK fields
  if ('hub_id' in updates && !updates.hub_id) updates.hub_id = null;
  if ('primary_collection_id' in updates && !updates.primary_collection_id) updates.primary_collection_id = null;
  if ('thumbnail_url' in updates && !updates.thumbnail_url) updates.thumbnail_url = null;

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: delete post and related data
export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const supabase = getServiceClient();
  // post_products cascade handles itself
  const { error } = await supabase.from('posts').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
