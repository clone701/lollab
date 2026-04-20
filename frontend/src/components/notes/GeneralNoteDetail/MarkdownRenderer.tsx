'use client';

/**
 * MarkdownRenderer コンポーネント
 *
 * react-markdown を使用してマークダウンテキストをHTMLにレンダリングする
 * Requirements: 3.1, 3.2, 3.3
 */

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { rehypeChampionMention } from './rehypeChampionMention';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeChampionMention]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-1">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          p: ({ children }) => (
            <p className="mb-1 leading-relaxed">{children}</p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
