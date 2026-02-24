"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  content: string;
  isStreaming: boolean;
  placeholder?: string;
  showCopy?: boolean;
}

/** Render markdown-like content with basic formatting */
function renderMarkdown(text: string): string {
  // Escape HTML first
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .split('\n\n')
    .map((block) => {
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<blockquote')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

export default function StreamingContent({
  content,
  isStreaming,
  placeholder = "结果将显示在这里...",
  showCopy = false,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isStreaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content && !isStreaming) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-50">💡</div>
          <p className="text-sm">{placeholder}</p>
        </div>
      </div>
    );
  }

  if (isStreaming && !content) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">AI 思考中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {showCopy && content && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1"
          >
            {copied ? "✓ 已复制" : "📋 复制全文"}
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
        <div
          className={`prose-custom ${isStreaming && content ? "typing-cursor" : ""}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
