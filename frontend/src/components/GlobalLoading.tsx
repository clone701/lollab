/**
 * GlobalLoading コンポーネント
 *
 * アプリケーション全体で使用するローディング表示
 * 非同期処理中に画面右下にGIFアニメーションを表示する
 */

export default function GlobalLoading({ loading }: { loading: boolean }) {
  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 9999,
      }}
    >
      {/* GIFアニメーションは通常のimgタグを使用（Next.js Imageは非対応） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/loading/nunu.gif"
        alt="Loading"
        width={240}
        height={240}
      />
    </div>
  );
}
