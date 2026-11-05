'use client';

import SummonerSpellPicker from '../SummonerSpellPicker';
import ItemBuildSelector from '../ItemBuildSelector';
import { NoteFormRuneSection } from './NoteFormRuneSection';
import { NoteFormMemoField } from './NoteFormMemoField';
import { NoteFormFieldsProps } from './types';
import { SUMMONER_SPELLS } from '@/lib/data/summonerSpells';
import { STARTER_ITEMS } from '@/lib/data/items';

// 閲覧モード用: SS・アイテムを選択済みのみ横並び表示
function SpellItemView({
  spells,
  items,
}: {
  spells: string[];
  items: string[];
}) {
  const selectedSpells = SUMMONER_SPELLS.filter((s) => spells.includes(s.id));
  const itemCounts: Record<string, number> = {};
  items.forEach((id) => {
    itemCounts[id] = (itemCounts[id] || 0) + 1;
  });
  const selectedItems = Object.entries(itemCounts)
    .map(([id, count]) => ({
      item: STARTER_ITEMS.find((i) => i.id === id),
      count,
    }))
    .filter((e) => e.item);

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div>
        <p className="text-xs text-fg-muted mb-1">サモナースペル</p>
        <div className="flex gap-2">
          {selectedSpells.length === 0 ? (
            <span className="text-xs text-fg-subtle">未設定</span>
          ) : (
            selectedSpells.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.id}
                src={s.icon}
                alt={s.name}
                title={s.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded"
              />
            ))
          )}
        </div>
      </div>
      <div className="w-px h-10 bg-surface-2" />
      <div>
        <p className="text-xs text-fg-muted mb-1">初期アイテム</p>
        <div className="flex gap-2 flex-wrap">
          {selectedItems.length === 0 ? (
            <span className="text-xs text-fg-subtle">未設定</span>
          ) : (
            selectedItems.map(
              ({ item, count }) =>
                item && (
                  <div key={item.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.icon}
                      alt={item.name}
                      title={item.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded"
                    />
                    {count > 1 && (
                      <span className="absolute -top-1 -right-1 bg-action text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </div>
                )
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function NoteFormFields({
  mode,
  presetName,
  runes,
  runeKey,
  spells,
  items,
  memo,
  errors,
  setPresetName,
  setRunes,
  setSpells,
  setItems,
  setMemo,
  handleRuneReset,
}: NoteFormFieldsProps) {
  const isView = mode === 'view';
  return (
    <>
      <div className="mb-6" id="section-preset">
        <label
          htmlFor="preset-name"
          className="block text-sm font-medium text-fg-muted mb-2"
        >
          プリセット名（空欄の場合は「VS相手チャンピオン名」が自動設定されます）
        </label>
        <input
          id="preset-name"
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          disabled={isView}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${errors.presetName ? 'border-danger' : 'border-line-strong'} ${isView ? 'bg-surface-2 cursor-not-allowed' : ''}`}
          placeholder="例: 序盤安定型"
        />
        {errors.presetName && (
          <p className="text-sm text-danger-fg mt-1" role="alert">
            {errors.presetName}
          </p>
        )}
      </div>
      {isView ? (
        <SpellItemView spells={spells} items={items} />
      ) : (
        <div className="space-y-6 mb-6">
          <div id="section-spells">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-fg">サモナースペル</h3>
              <button
                onClick={() => setSpells([])}
                className="px-2 py-1 text-xs text-fg-muted border border-line-strong rounded hover:bg-surface-2 transition-colors duration-150"
              >
                リセット
              </button>
            </div>
            <SummonerSpellPicker
              value={spells}
              onChange={setSpells}
              disabled={false}
            />
            {errors.spells && (
              <p className="text-sm text-danger-fg mt-1" role="alert">
                {errors.spells}
              </p>
            )}
          </div>
          <div id="section-items">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-fg">初期アイテム</h3>
              <button
                onClick={() => setItems([])}
                className="px-2 py-1 text-xs text-fg-muted border border-line-strong rounded hover:bg-surface-2 transition-colors duration-150"
              >
                リセット
              </button>
            </div>
            <ItemBuildSelector
              value={items}
              onChange={setItems}
              disabled={false}
            />
            {errors.items && (
              <p className="text-sm text-danger-fg mt-1" role="alert">
                {errors.items}
              </p>
            )}
          </div>
        </div>
      )}
      <NoteFormRuneSection
        mode={mode}
        runes={runes}
        runeKey={runeKey}
        errors={errors}
        setRunes={setRunes}
        handleRuneReset={handleRuneReset}
      />
      <NoteFormMemoField
        mode={mode}
        memo={memo}
        errors={errors}
        setMemo={setMemo}
      />
    </>
  );
}
