'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PostData {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  content: string;
  excerpt: string | null;
  status: string;
  primary_keyword: string;
  secondary_keywords: string[];
  author_name: string;
  author_bio: string | null;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/posts?id=${postId}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/admin/posts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post.id,
        title: post.title,
        meta_description: post.meta_description,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        primary_keyword: post.primary_keyword,
        secondary_keywords: post.secondary_keywords,
        author_name: post.author_name,
        author_bio: post.author_bio,
        word_count: post.content.length,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/admin/posts?id=${postId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/posts');
    }
  };

  const updateField = (field: keyof PostData, value: string | string[]) => {
    if (!post) return;
    setPost({ ...post, [field]: value });
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">로딩 중...</div>;
  }
  if (!post) {
    return <div className="py-12 text-center text-gray-400">포스트를 찾을 수 없습니다</div>;
  }

  // Strip template comment from content for display
  const displayContent = post.content.replace(/<!--TEMPLATE:[\s\S]*?-->\n?/, '');

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">
          ← 목록으로
        </button>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">저장됨</span>}
          <select
            value={post.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="draft">임시저장</option>
            <option value="published">발행</option>
            <option value="archived">보관</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              삭제
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              정말 삭제
            </button>
          )}
        </div>
      </div>

      {/* Meta Fields */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-gray-500">제목</label>
          <input
            value={post.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">주요 키워드</label>
          <input
            value={post.primary_keyword}
            onChange={(e) => updateField('primary_keyword', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500">메타 설명 (80~120자)</label>
          <input
            value={post.meta_description ?? ''}
            onChange={(e) => updateField('meta_description', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">{(post.meta_description ?? '').length}자</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">작성자</label>
          <input
            value={post.author_name}
            onChange={(e) => updateField('author_name', e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">발행 상태</label>
          <p className="mt-1 text-sm">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                post.status === 'published'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}
            >
              {post.status === 'published' ? '발행됨' : post.status === 'draft' ? '임시저장' : '보관'}
            </span>
            <span className="ml-2 text-xs text-gray-400">{post.content.length}자</span>
          </p>
        </div>
      </div>

      {/* Content Editor + Preview */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('edit')}
            className={`px-5 py-3 text-sm font-medium ${
              tab === 'edit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            편집
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`px-5 py-3 text-sm font-medium ${
              tab === 'preview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            미리보기
          </button>
        </div>

        {tab === 'edit' ? (
          <textarea
            value={displayContent}
            onChange={(e) => updateField('content', e.target.value)}
            className="h-[600px] w-full resize-none p-4 font-mono text-sm leading-relaxed focus:outline-none"
            placeholder="마크다운 콘텐츠..."
          />
        ) : (
          <div
            className="prose prose-sm max-w-none p-6"
            dangerouslySetInnerHTML={{
              __html: simpleMarkdown(displayContent),
            }}
          />
        )}
      </div>
    </div>
  );
}

// Minimal markdown → HTML for preview (no external deps)
function simpleMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-6 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/gm, '<p class="my-2">$1</p>');
}
