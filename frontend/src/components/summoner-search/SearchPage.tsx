import type { Region } from '@/types/summoner';
import SearchForm from './SearchForm';

interface SearchPageProps {
  onSearch: (query: string, region: Region) => void;
}

export default function SearchPage({ onSearch }: SearchPageProps) {
  return (
    <main className="flex flex-col items-center gap-8 py-16 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">サモナー検索</h1>
        <p className="text-gray-600 text-sm">
          サモナー名を入力して戦績を確認しましょう
        </p>
      </div>
      <div className="w-full max-w-lg">
        <SearchForm onSearch={onSearch} />
      </div>
    </main>
  );
}
