import Link from 'next/link';

// 存在しない URL の画面。静的書き出しでは out/404.html になる
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <h1 className="text-xl font-bold text-fg">ページが見つかりません</h1>
      <p className="text-sm text-fg-muted">
        URL が間違っているか、ページが移動した可能性があります。
      </p>
      <Link
        href="/"
        className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
