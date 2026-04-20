'use client';

import { RefObject } from 'react';

// execCommandでundo履歴を保持しながらテキストを挿入する
function execInsert(el: HTMLTextAreaElement, text: string) {
  el.focus();
  // execCommandはundo履歴を維持する（非推奨だが現状最も確実）
  const success = document.execCommand('insertText', false, text);
  if (!success) {
    // フォールバック: execCommandが使えない環境向け
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + text + after;
    el.setSelectionRange(start + text.length, start + text.length);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function useMarkdownToolbar(
  body: string,
  textareaRef: RefObject<HTMLTextAreaElement | null>
) {
  function insertMarkdown(prefix: string, suffix = '', linePrefix = '') {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);

    if (linePrefix) {
      const lineStart = body.lastIndexOf('\n', start - 1) + 1;
      const line = body.slice(lineStart, end);
      const hasPrefix = line.startsWith(linePrefix);
      // 行全体を選択して置換
      el.setSelectionRange(lineStart, end);
      execInsert(
        el,
        hasPrefix ? line.slice(linePrefix.length) : linePrefix + line
      );
    } else {
      execInsert(el, prefix + selected + suffix);
      // カーソルを適切な位置に
      if (!selected) {
        const pos = start + prefix.length;
        requestAnimationFrame(() => el.setSelectionRange(pos, pos));
      }
    }
  }

  return {
    bold: () => insertMarkdown('**', '**'),
    italic: () => insertMarkdown('*', '*'),
    heading: () => insertMarkdown('## ', ''),
    bulletList: () => insertMarkdown('', '', '- '),
    numberedList: () => insertMarkdown('', '', '1. '),
  };
}
