'use client';

import { useState } from 'react';
import Image from 'next/image';
import ChampionSelector from '@/components/notes/ChampionSelector';
import { getChampionById } from '@/lib/data/champions';

/**
 * ChampionSelectorコンポーネントのテストページ
 * 
 * このページは開発中の動作確認用です。
 * 本番環境では削除してください。
 */
export default function TestChampionSelectorPage() {
    const [myChampion, setMyChampion] = useState<string | null>(null);
    const [enemyChampion, setEnemyChampion] = useState<string | null>(null);

    const myChampionData = myChampion ? getChampionById(myChampion) : null;
    const enemyChampionData = enemyChampion ? getChampionById(enemyChampion) : null;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">ChampionSelector テストページ</h1>

                {/* 選択結果表示 */}
                <div className="mb-8 p-6 bg-gray-900 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">選択結果</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">マイチャンピオン:</p>
                            {myChampionData ? (
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={myChampionData.imagePath}
                                        alt={myChampionData.name}
                                        width={48}
                                        height={48}
                                        className="rounded"
                                    />
                                    <span className="text-lg font-medium">{myChampionData.name}</span>
                                    <span className="text-sm text-gray-500">({myChampionData.id})</span>
                                </div>
                            ) : (
                                <p className="text-gray-500">未選択</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-2">敵チャンピオン:</p>
                            {enemyChampionData ? (
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={enemyChampionData.imagePath}
                                        alt={enemyChampionData.name}
                                        width={48}
                                        height={48}
                                        className="rounded"
                                    />
                                    <span className="text-lg font-medium">{enemyChampionData.name}</span>
                                    <span className="text-sm text-gray-500">({enemyChampionData.id})</span>
                                </div>
                            ) : (
                                <p className="text-gray-500">未選択</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* マイチャンピオン選択 */}
                <div className="mb-8 p-6 bg-gray-900 rounded-lg">
                    <ChampionSelector
                        value={myChampion}
                        onChange={setMyChampion}
                        label="マイチャンピオン"
                    />
                </div>

                {/* 敵チャンピオン選択 */}
                <div className="mb-8 p-6 bg-gray-900 rounded-lg">
                    <ChampionSelector
                        value={enemyChampion}
                        onChange={setEnemyChampion}
                        label="敵チャンピオン"
                    />
                </div>

                {/* リセットボタン */}
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setMyChampion(null);
                            setEnemyChampion(null);
                        }}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                    >
                        選択をリセット
                    </button>
                </div>

                {/* テスト項目チェックリスト */}
                <div className="mt-8 p-6 bg-gray-900 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">テスト項目チェックリスト</h2>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>全チャンピオンの画像が表示される</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>検索機能が動作する（部分一致、大文字小文字区別なし）</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>チャンピオンをクリックすると選択される</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>選択されたチャンピオンにピンク色のボーダーが表示される</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>ホバー時にチャンピオン名が表示される</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>レスポンシブグリッド（4列→6列→8列）が動作する</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>画像の遅延読み込み（lazy loading）が設定されている</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
