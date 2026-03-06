'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PostData {
  id?: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  primary_keyword: string;
  secondary_keywords: string[];
  author_name: string;
  author_bio: string;
  category_id: string;
  hub_id: string;
  primary_collection_id: string;
  thumbnail_url: string;
  faq_json: { question: string; answer: string }[];
}

interface CategoryOption {
  id: string;
  name: string;
}

interface HubOption {
  id: string;
  title: string;
}

interface CollectionOption {
  id: string;
  title: string;
}

interface PostEditorProps {
  post?: PostData;
  categories: CategoryOption[];
  hubs: HubOption[];
  collections: CollectionOption[];
  isNew?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KOREAN_ROMANIZATION: Record<string, string> = {
  ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r',
  ㅁ: 'm', ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: '',
  ㅈ: 'j', ㅉ: 'jj', ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h',
  ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e',
  ㅕ: 'yeo', ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe',
  ㅛ: 'yo', ㅜ: 'u', ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu',
  ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i',
};

const INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const MEDIALS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const FINALS = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function decomposeKorean(char: string): string {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return char;
  const offset = code - 0xAC00;
  const initial = INITIALS[Math.floor(offset / (21 * 28))];
  const medial = MEDIALS[Math.floor((offset % (21 * 28)) / 28)];
  const final = FINALS[offset % 28];
  const parts = [initial, medial];
  if (final) parts.push(final);
  return parts.map(p => KOREAN_ROMANIZATION[p] ?? p).join('');
}

function slugify(text: string): string {
  const romanized = Array.from(text).map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) return decomposeKorean(ch);
    if (code >= 0x3131 && code <= 0x3163) return KOREAN_ROMANIZATION[ch] ?? ch;
    return ch;
  }).join('');

  return romanized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function countKoreanWords(text: string): number {
  const stripped = text.replace(/[#*_`\[\]()>|~-]/g, ' ');
  const chars = stripped.replace(/\s+/g, '').length;
  // Korean: roughly 1 word per 3-4 characters; for mixed, count space-separated tokens too
  const spaceTokens = stripped.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(spaceTokens, Math.ceil(chars / 3.5));
}

function calcReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

const DEFAULT_POST: PostData = {
  slug: '',
  title: '',
  meta_description: '',
  content: '',
  excerpt: '',
  status: 'draft',
  primary_keyword: '',
  secondary_keywords: [],
  author_name: '에디터',
  author_bio: '',
  category_id: '',
  hub_id: '',
  primary_collection_id: '',
  thumbnail_url: '',
  faq_json: [],
};

// ─── Markdown Toolbar Helpers ────────────────────────────────────────────────

interface ToolbarAction {
  label: string;
  icon: string;
  action: (
    textarea: HTMLTextAreaElement,
    content: string,
    setContent: (v: string) => void,
  ) => void;
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  content: string,
  setContent: (v: string) => void,
  before: string,
  after: string,
  placeholder: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.slice(start, end) || placeholder;
  const newText = content.slice(0, start) + before + selected + after + content.slice(end);
  setContent(newText);
  requestAnimationFrame(() => {
    textarea.focus();
    const cursorStart = start + before.length;
    const cursorEnd = cursorStart + selected.length;
    textarea.setSelectionRange(cursorStart, cursorEnd);
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  content: string,
  setContent: (v: string) => void,
  insertion: string,
) {
  const start = textarea.selectionStart;
  const newText = content.slice(0, start) + insertion + content.slice(start);
  setContent(newText);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + insertion.length;
    textarea.setSelectionRange(pos, pos);
  });
}

function prefixLines(
  textarea: HTMLTextAreaElement,
  content: string,
  setContent: (v: string) => void,
  prefix: string,
  placeholder: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.slice(start, end);
  if (!selected) {
    const line = prefix + placeholder + '\n';
    const newText = content.slice(0, start) + line + content.slice(end);
    setContent(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
    });
    return;
  }
  const lines = selected.split('\n').map(l => prefix + l).join('\n');
  const newText = content.slice(0, start) + lines + content.slice(end);
  setContent(newText);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start, start + lines.length);
  });
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: 'H2',
    icon: 'H2',
    action: (ta, c, s) => prefixLines(ta, c, s, '## ', '제목'),
  },
  {
    label: 'H3',
    icon: 'H3',
    action: (ta, c, s) => prefixLines(ta, c, s, '### ', '소제목'),
  },
  {
    label: 'Bold',
    icon: 'B',
    action: (ta, c, s) => wrapSelection(ta, c, s, '**', '**', '굵은 텍스트'),
  },
  {
    label: 'Italic',
    icon: 'I',
    action: (ta, c, s) => wrapSelection(ta, c, s, '*', '*', '기울임 텍스트'),
  },
  {
    label: 'Link',
    icon: '🔗',
    action: (ta, c, s) => {
      const url = window.prompt('URL을 입력하세요');
      if (!url) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = c.slice(start, end) || '링크 텍스트';
      const link = `[${selected}](${url})`;
      const newText = c.slice(0, start) + link + c.slice(end);
      s(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + 1, start + 1 + selected.length);
      });
    },
  },
  {
    label: 'Image',
    icon: '🖼',
    action: (ta, c, s) => {
      const url = window.prompt('이미지 URL을 입력하세요');
      if (!url) return;
      const start = ta.selectionStart;
      const alt = c.slice(start, ta.selectionEnd) || '이미지 설명';
      const img = `![${alt}](${url})`;
      const newText = c.slice(0, start) + img + c.slice(ta.selectionEnd);
      s(newText);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + img.length;
        ta.setSelectionRange(pos, pos);
      });
    },
  },
  {
    label: 'Bullet List',
    icon: '•',
    action: (ta, c, s) => prefixLines(ta, c, s, '- ', '항목'),
  },
  {
    label: 'Numbered List',
    icon: '1.',
    action: (ta, c, s) => {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = c.slice(start, end);
      if (!selected) {
        const line = '1. 항목\n';
        s(c.slice(0, start) + line + c.slice(end));
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(start + 3, start + 3 + 2);
        });
        return;
      }
      const lines = selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
      s(c.slice(0, start) + lines + c.slice(end));
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start, start + lines.length);
      });
    },
  },
  {
    label: 'Quote',
    icon: '>',
    action: (ta, c, s) => prefixLines(ta, c, s, '> ', '인용문'),
  },
  {
    label: 'Horizontal Rule',
    icon: '―',
    action: (ta, c, s) => insertAtCursor(ta, c, s, '\n---\n'),
  },
  {
    label: 'Table',
    icon: '⊞',
    action: (ta, c, s) => {
      const table = `\n| 제품명 | 가격 | 평점 | 비고 |\n| --- | --- | --- | --- |\n| 제품 A | ₩00,000 | ★★★★☆ | - |\n| 제품 B | ₩00,000 | ★★★★★ | - |\n`;
      insertAtCursor(ta, c, s, table);
    },
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PostEditor({
  post,
  categories,
  hubs,
  collections,
  isNew = false,
}: PostEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<PostData>(() => ({
    ...DEFAULT_POST,
    ...post,
    secondary_keywords: post?.secondary_keywords ?? [],
    faq_json: post?.faq_json ?? [],
  }));
  const [secondaryKeywordsInput, setSecondaryKeywordsInput] = useState(
    () => (post?.secondary_keywords ?? []).join(', '),
  );
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  // Auto-generate slug from title when not manually edited
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm(prev => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [form.title, slugManual]);

  // Field updaters
  const setField = useCallback(<K extends keyof PostData>(key: K, value: PostData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSecondaryKeywords = useCallback((raw: string) => {
    setSecondaryKeywordsInput(raw);
    const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
    setForm(prev => ({ ...prev, secondary_keywords: arr }));
    setSaved(false);
  }, []);

  // FAQ management
  const addFaq = useCallback(() => {
    setForm(prev => ({
      ...prev,
      faq_json: [...prev.faq_json, { question: '', answer: '' }],
    }));
    setSaved(false);
  }, []);

  const removeFaq = useCallback((idx: number) => {
    setForm(prev => ({
      ...prev,
      faq_json: prev.faq_json.filter((_, i) => i !== idx),
    }));
    setSaved(false);
  }, []);

  const updateFaq = useCallback((idx: number, field: 'question' | 'answer', value: string) => {
    setForm(prev => ({
      ...prev,
      faq_json: prev.faq_json.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item,
      ),
    }));
    setSaved(false);
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const wordCount = countKoreanWords(form.content);
      const readingTime = calcReadingTime(wordCount);
      const payload = {
        ...form,
        word_count: wordCount,
        reading_time_min: readingTime,
      };

      if (isNew) {
        const res = await fetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('저장 실패');
        const data = await res.json() as { id: string };
        router.push(`/admin/posts/${data.id}/edit`);
      } else {
        const res = await fetch('/api/admin/posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('저장 실패');
        setSaved(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }, [form, isNew, router]);

  // Delete
  const handleDelete = useCallback(async () => {
    if (!form.id) return;
    const confirmed = window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts?id=${form.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('삭제 실패');
      router.push('/admin/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  }, [form.id, router]);

  // Toolbar handler
  const handleToolbar = useCallback((action: ToolbarAction['action']) => {
    const ta = textareaRef.current;
    if (!ta) return;
    action(ta, form.content, (v: string) => setField('content', v));
  }, [form.content, setField]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between">
          <button
            onClick={() => router.push('/admin/posts')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            &larr; 목록
          </button>

          <div className="flex items-center gap-3">
            {/* Status selector */}
            <select
              value={form.status}
              onChange={e => setField('status', e.target.value as PostData['status'])}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* Save indicator */}
            {saved && (
              <span className="text-sm text-green-600">저장됨 &#10003;</span>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>

            {/* Delete button (edit only) */}
            {!isNew && form.id && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-50 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Layout ─────────────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-screen-xl gap-6 px-6 py-6">
        {/* ─── Left Column (70%) ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-xl font-bold text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {/* Slug */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-gray-500">/blog/</span>
            <input
              type="text"
              value={form.slug}
              onChange={e => {
                setSlugManual(true);
                setField('slug', e.target.value);
              }}
              placeholder="url-slug"
              className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-mono text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {slugManual && (
              <button
                onClick={() => {
                  setSlugManual(false);
                  setField('slug', slugify(form.title));
                }}
                className="shrink-0 text-xs text-blue-600 hover:underline"
              >
                자동 생성
              </button>
            )}
          </div>

          {/* ─── Markdown Editor ──────────────────────────────────────── */}
          <div className="rounded border border-gray-300 bg-white">
            {/* Tab switching */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setTab('edit')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tab === 'edit'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                편집
              </button>
              <button
                onClick={() => setTab('preview')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tab === 'preview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                미리보기
              </button>
            </div>

            {tab === 'edit' ? (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 px-3 py-2">
                  {TOOLBAR_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      type="button"
                      title={action.label}
                      onClick={() => handleToolbar(action.action)}
                      className="rounded px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={e => setField('content', e.target.value)}
                  placeholder="마크다운으로 작성하세요..."
                  className="w-full resize-y px-4 py-3 font-mono text-sm leading-relaxed text-gray-800 placeholder-gray-400 focus:outline-none"
                  style={{ minHeight: '600px' }}
                />
              </>
            ) : (
              /* Preview */
              <div className="prose prose-sm max-w-none px-6 py-4">
                {form.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-400">내용이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Sidebar (30%) ────────────────────────────────────── */}
        <div className="w-80 shrink-0 space-y-5">
          {/* Category */}
          <SidebarSection title="카테고리">
            <select
              value={form.category_id}
              onChange={e => setField('category_id', e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">카테고리 선택</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </SidebarSection>

          {/* Hub */}
          <SidebarSection title="허브 페이지">
            <select
              value={form.hub_id}
              onChange={e => setField('hub_id', e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">선택 안함</option>
              {hubs.map(h => (
                <option key={h.id} value={h.id}>{h.title}</option>
              ))}
            </select>
          </SidebarSection>

          {/* Collection */}
          <SidebarSection title="컬렉션">
            <select
              value={form.primary_collection_id}
              onChange={e => setField('primary_collection_id', e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">선택 안함</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </SidebarSection>

          {/* Primary keyword */}
          <SidebarSection title="주요 키워드">
            <input
              type="text"
              value={form.primary_keyword}
              onChange={e => setField('primary_keyword', e.target.value)}
              placeholder="예: 캠핑의자 추천"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </SidebarSection>

          {/* Secondary keywords */}
          <SidebarSection title="부 키워드">
            <input
              type="text"
              value={secondaryKeywordsInput}
              onChange={e => handleSecondaryKeywords(e.target.value)}
              placeholder="쉼표로 구분 (예: 경량, 접이식)"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {form.secondary_keywords.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {form.secondary_keywords.map((kw, i) => (
                  <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </SidebarSection>

          {/* Thumbnail */}
          <SidebarSection title="썸네일 URL">
            <input
              type="text"
              value={form.thumbnail_url}
              onChange={e => setField('thumbnail_url', e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {form.thumbnail_url && (
              <div className="mt-2 overflow-hidden rounded border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.thumbnail_url}
                  alt="썸네일 미리보기"
                  className="h-auto w-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </SidebarSection>

          {/* Meta description */}
          <SidebarSection title="메타 설명">
            <textarea
              value={form.meta_description}
              onChange={e => setField('meta_description', e.target.value)}
              placeholder="검색 결과에 표시될 설명 (80~120자)"
              rows={3}
              className="w-full resize-y rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <CharCounter text={form.meta_description} min={80} max={120} />
          </SidebarSection>

          {/* Excerpt */}
          <SidebarSection title="요약">
            <textarea
              value={form.excerpt}
              onChange={e => setField('excerpt', e.target.value)}
              placeholder="글의 간략한 요약"
              rows={2}
              className="w-full resize-y rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </SidebarSection>

          {/* Author name */}
          <SidebarSection title="작성자">
            <input
              type="text"
              value={form.author_name}
              onChange={e => setField('author_name', e.target.value)}
              placeholder="에디터"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </SidebarSection>

          {/* Author bio */}
          <SidebarSection title="작성자 소개">
            <textarea
              value={form.author_bio}
              onChange={e => setField('author_bio', e.target.value)}
              placeholder="작성자에 대한 간단한 소개"
              rows={2}
              className="w-full resize-y rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </SidebarSection>

          {/* FAQ Section */}
          <SidebarSection title="자주 묻는 질문 (FAQ)">
            {form.faq_json.map((faq, idx) => (
              <div key={idx} className="mb-3 rounded border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Q&A #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFaq(idx)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    삭제
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={e => updateFaq(idx, 'question', e.target.value)}
                  placeholder="질문"
                  className="mb-1.5 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <textarea
                  value={faq.answer}
                  onChange={e => updateFaq(idx, 'answer', e.target.value)}
                  placeholder="답변"
                  rows={2}
                  className="w-full resize-y rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addFaq}
              className="w-full rounded border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + FAQ 추가
            </button>
          </SidebarSection>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CharCounter({ text, min, max }: { text: string; min: number; max: number }) {
  const len = text.length;
  const color =
    len === 0
      ? 'text-gray-400'
      : len < min
        ? 'text-yellow-600'
        : len > max
          ? 'text-red-600'
          : 'text-green-600';
  return (
    <p className={`mt-1 text-xs ${color}`}>
      {len}자 (권장: {min}~{max}자)
    </p>
  );
}
