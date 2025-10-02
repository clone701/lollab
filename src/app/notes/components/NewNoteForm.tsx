'use client';

import { useState } from 'react';
import ChampionSelectModal from './ChampionSelectModal';

export default function NewNoteForm() {
  const [mode, setMode] = useState<'select' | 'counter'>('select');
  const [modalOpen, setModalOpen] = useState<'me' | 'enemy' | null>(null);
  const [myChampion, setMyChampion] = useState<any>(null);
  const [enemyChampion, setEnemyChampion] = useState<any>(null);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* 左パネル */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 w-full max-w-xs flex flex-col gap-4">
        {mode === 'select' ? (
          <>
            <div className="text-base font-semibold mb-2">ノートの種類を選択</div>
            <button
              className="w-full text-left bg-gray-50 border border-[var(--border)] rounded-lg p-4 mb-2 hover:bg-gray-100 transition"
              // 汎用ノートは未実装なので何もしない
              type="button"
            >
              <div className="font-semibold text-[var(--foreground)]">汎用ノート</div>
              <div className="text-sm text-gray-500">タイトルと内容を自由に記録できるノートです</div>
            </button>
            <button
              className="w-full text-left bg-gray-50 border border-[var(--border)] rounded-lg p-4 hover:bg-gray-100 transition"
              onClick={() => setMode('counter')}
              type="button"
            >
              <div className="font-semibold text-[var(--foreground)]">チャンピオン対策</div>
              <div className="text-sm text-gray-500">特定のチャンピオン対策に特化した対策ノートです</div>
            </button>
          </>
        ) : (
          // チャンピオン対策ノート作成UI
          <>
            <div className="flex justify-between gap-2 mb-2">
              {['TOP', 'JG', 'MID', 'ADC', 'SUP'].map((role) => (
                <button
                  key={role}
                  className={`px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200`}
                  type="button"
                  // 役割選択ロジックは必要に応じて追加
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1"
                onClick={() => setModalOpen('me')}
                type="button"
              >
                {myChampion ? (
                  <>
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${myChampion.id}.png`}
                      alt={myChampion.name}
                      className="w-6 h-6 rounded-full"
                    />
                    {myChampion.name}
                  </>
                ) : (
                  <>
                    <span className="text-lg">＋</span>自分
                  </>
                )}
              </button>
              <span className="text-gray-400 text-lg">↔</span>
              <button
                className="bg-pink-100 text-pink-700 rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1"
                onClick={() => setModalOpen('enemy')}
                type="button"
              >
                {enemyChampion ? (
                  <>
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${enemyChampion.id}.png`}
                      alt={enemyChampion.name}
                      className="w-6 h-6 rounded-full"
                    />
                    {enemyChampion.name}
                  </>
                ) : (
                  <>
                    <span className="text-lg">＋</span>敵
                  </>
                )}
              </button>
            </div>
            <ChampionSelectModal
              open={modalOpen !== null}
              onClose={() => setModalOpen(null)}
              onSelect={champ => {
                if (modalOpen === 'me') setMyChampion(champ);
                if (modalOpen === 'enemy') setEnemyChampion(champ);
              }}
            />
            <button
              className="bg-[var(--button-text)] text-white w-full py-2 rounded-lg font-semibold mt-2"
              type="button"
            >
              新規ノート作成
            </button>
            <button
              className="mt-2 text-xs text-gray-400 underline"
              type="button"
              onClick={() => setMode('select')}
            >
              ← ノートの種類選択に戻る
            </button>
          </>
        )}
      </div>
      {/* 右パネル */}
      <div className="flex-1 flex items-center justify-center min-h-[200px] border border-[var(--border)] bg-white rounded-xl">
        {mode === 'select' ? (
          <span className="text-gray-400 text-lg text-center">
            ノートの種類を選択してください。<br />
            左のパネルから汎用ノートまたはチャンピオン対策を選択してください。
          </span>
        ) : (
          <span className="text-gray-400 text-lg text-center">
            チャンピオンを選択してください。<br />
            左のセットアップから自分のチャンピオンと相手のチャンピオンを選択してください。
          </span>
        )}
      </div>
    </div>
  );
}