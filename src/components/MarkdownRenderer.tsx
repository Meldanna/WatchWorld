import React, { useState } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const rawHtml = React.useMemo(() => {
    try {
      return marked.parse(content || '') as string;
    } catch {
      return content || '';
    }
  }, [content]);

  return (
    <div className="relative text-slate-800 dark:text-slate-100 text-[15px] leading-relaxed break-words font-normal">
      <div
        className="prose dark:prose-invert max-w-none 
          prose-p:my-2 prose-p:leading-relaxed
          prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-ul:my-2 prose-ul:pl-5 prose-ol:my-2 prose-ol:pl-5
          prose-li:my-1
          prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:border prose-pre:border-slate-300 dark:prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-3 prose-pre:my-3
          prose-code:text-emerald-600 dark:prose-code:text-emerald-300 prose-code:bg-slate-100 dark:prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-2 prose-blockquote:border-emerald-500/60 prose-blockquote:pl-3 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:my-2
          prose-table:w-full prose-table:my-2 prose-table:text-sm
          prose-th:border-b prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-th:py-1.5 prose-th:px-2 prose-th:text-left
          prose-td:border-b prose-td:border-slate-200 dark:prose-td:border-slate-800/60 prose-td:py-1.5 prose-td:px-2
          prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:underline hover:opacity-80"
        dangerouslySetInnerHTML={{ __html: rawHtml }}
      />
    </div>
  );
};
