'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
  hubCard?: ReactNode;
  collectionCard?: ReactNode;
}

export default function MarkdownRenderer({
  content,
  hubCard,
  collectionCard,
}: MarkdownRendererProps) {
  // Track h2 count to inject cards at the right positions
  let h2Count = 0;

  // Detect conclusion section keywords
  const isConclusion = (text: string) =>
    /^(최종 추천|결론|마무리|최종 평가)/.test(text.trim());

  const components: Components = {
    h2: ({ children }) => {
      h2Count++;
      const text = String(children);
      return (
        <>
          {/* Inject hubCard after 2nd h2 */}
          {h2Count === 3 && hubCard}
          {/* Inject collectionCard before conclusion */}
          {isConclusion(text) && collectionCard}
          <h2 className="mt-8 mb-4 text-xl font-bold text-gray-900">{children}</h2>
        </>
      );
    },
    h3: ({ children }) => (
      <h3 className="mt-6 mb-3 text-lg font-semibold text-gray-900">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 list-disc pl-5 space-y-1 text-gray-700">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-decimal pl-5 space-y-1 text-gray-700">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="mt-8">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
