import { RuneConfig } from '@/types/note';

interface ValidateParams {
  mode: 'create' | 'view' | 'edit';
  presetName: string;
  spells: string[];
  runes: RuneConfig | null;
  items: string[];
  memo: string;
}

export function validateNoteForm({
  mode,
  presetName,
  spells,
  runes,
  items,
  memo,
}: ValidateParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (presetName.length > 100) {
    errors.presetName = 'プリセット名は100文字以内で入力してください';
  }

  if ((mode === 'create' || mode === 'edit') && spells.length !== 2) {
    errors.spells = 'サモナースペルを2つ選択してください';
  }

  if (mode === 'create' || mode === 'edit') {
    if (!runes) {
      errors.runes = 'ルーンを選択してください';
    } else if (
      !runes.primaryPath ||
      !runes.keystone ||
      runes.primaryRunes?.length !== 3
    ) {
      errors.runes = 'メインルーンを全て選択してください';
    } else if (!runes.secondaryPath || runes.secondaryRunes?.length !== 2) {
      errors.runes = 'サブルーンを全て選択してください';
    } else if (
      !runes.shards ||
      runes.shards.length !== 3 ||
      runes.shards.some((s) => !s)
    ) {
      errors.runes = 'ステータスルーン（Shards）を全て選択してください';
    }
  }

  if ((mode === 'create' || mode === 'edit') && items.length === 0) {
    errors.items = 'アイテムを少なくとも1つ選択してください';
  }

  if (memo.length > 10000) {
    errors.memo = '対策メモは10,000文字以内で入力してください';
  }

  return errors;
}
