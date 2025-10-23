import Image from 'next/image';

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
      <Image
        src="/loading/nunu.gif"
        alt="Loading"
        width={240}   // 48 x 5 = 240
        height={240}  // 48 x 5 = 240
        priority
      />
    </div>
  );
}