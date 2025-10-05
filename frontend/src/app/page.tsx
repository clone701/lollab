import SearchBar from '@/components/SearchBar';
import RecentChips from '@/components/RecentChips';
import PinnedChips from '@/components/PinnedChips';

export default function HomePage() {
  return (
    <div className="py-10">
      {/* Hero */}
      <section className="mb-10">

        {/* Search */}
        <div className="mt-6">
          <SearchBar />
        </div>
      </section>

      {/* Body: left content + right card */}
      <section className="grid gap-8 md:grid-cols-[1fr,320px]">
        <div className="space-y-8">
          <RecentChips />
          <PinnedChips />
        </div>

      </section>
    </div>
  );
}