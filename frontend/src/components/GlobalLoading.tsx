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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/loading/nunu.gif"
        alt="Loading"
        width={240}
        height={240}
      />
    </div>
  );
}