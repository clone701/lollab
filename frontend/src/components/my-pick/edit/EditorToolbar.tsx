import { ChampionSearchInput } from '../ChampionSearchInput';

interface EditorToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  isFilledOnly: boolean;
  onFilledOnlyChange: (isFilledOnly: boolean) => void;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}

// 編集画面の上部。相手の検索・入力済みの行だけ表示・保存・キャンセル
export function EditorToolbar(p: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-48 flex-1">
        <ChampionSearchInput
          value={p.query}
          onChange={p.onQueryChange}
          label="相手チャンピオンを検索"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          checked={p.isFilledOnly}
          onChange={(e) => p.onFilledOnlyChange(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        入力済みの行だけ表示
      </label>
      <button
        type="button"
        onClick={p.onCancel}
        className="rounded bg-surface-2 px-4 py-2 text-sm font-medium text-fg-muted hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        キャンセル
      </button>
      <button
        type="button"
        onClick={p.onSave}
        disabled={!p.canSave}
        className="rounded bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        保存
      </button>
    </div>
  );
}
