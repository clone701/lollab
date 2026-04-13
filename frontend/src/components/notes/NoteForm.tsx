'use client';

import { useState } from 'react';
import RuneSelector from './RuneSelector';
import SummonerSpellPicker from './SummonerSpellPicker';
import ItemBuildSelector from './ItemBuildSelector';
import Toast from '@/components/ui/Toast';
import { RuneConfig } from '@/types/note';
import { createNote } from '@/lib/api/notes';
import useToast from '@/lib/hooks/useToast';
import { getChampionById } from '@/lib/utils/championHelpers';

interface NoteFormProps {
    myChampionId: string;
    enemyChampionId: string;
    onCancel: () => void;
    onSave: () => void;
}

/**
 * NoteForm - ノート作成フォームコンポーネント
 * 
 * プリセット名、ルーン、サモナースペル、アイテム、対策メモを入力するフォームを提供します。
 * 
 * バリデーション機能:
 * - プリセット名: 必須、100文字以内
 * - 対策メモ: 10,000文字以内
 * - エラーメッセージは入力欄の下に赤色で表示
 * - バリデーションエラーがある場合は保存を実行しない
 */
export default function NoteForm({
    myChampionId,
    enemyChampionId,
    onCancel,
    onSave,
}: NoteFormProps) {
    const [presetName, setPresetName] = useState('');
    const [runes, setRunes] = useState<RuneConfig | null>(null);
    const [runeKey, setRuneKey] = useState(0); // ルーンコンポーネントのリセット用キー
    const [spells, setSpells] = useState<string[]>([]);
    const [items, setItems] = useState<string[]>([]);
    const [memo, setMemo] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    /**
     * フォームバリデーション
     * @returns バリデーション成功時はtrue、失敗時はfalse
     */
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // プリセット名の検証（空でもOK、100文字以内のみチェック）
        if (presetName.length > 100) {
            newErrors.presetName = 'プリセット名は100文字以内で入力してください';
        }

        // 対策メモの検証
        if (memo.length > 10000) {
            newErrors.memo = '対策メモは10,000文字以内で入力してください';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * 保存ボタンクリック時の処理
     */
    const handleSave = async () => {
        // バリデーション実行
        if (!validate()) {
            return;
        }

        // プリセット名が空の場合、デフォルト名を設定
        let finalPresetName = presetName.trim();
        if (!finalPresetName) {
            const enemyChampion = getChampionById(enemyChampionId);
            if (enemyChampion) {
                finalPresetName = `VS${enemyChampion.name}`;
            } else {
                // チャンピオンが見つからない場合のフォールバック
                finalPresetName = 'デフォルトプリセット';
            }
        }

        setSaving(true);
        try {
            // ノートを作成（RLSポリシーにより自動的にユーザーIDが適用される）
            await createNote({
                my_champion_id: myChampionId,
                enemy_champion_id: enemyChampionId,
                preset_name: finalPresetName,
                runes,
                spells,
                items,
                memo: memo || null,
            });

            // 成功トースト表示
            showToast('ノートを作成しました', 'success');

            // 親コンポーネントのonSaveを呼び出し（一覧更新とフォームクローズ）
            onSave();
        } catch (error) {
            // エラートースト表示
            console.error('Failed to create note:', error);
            showToast('ノートの作成に失敗しました', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* トースト通知 */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                新規ノート作成
            </h2>

            {/* プリセット名入力 */}
            <div className="mb-6">
                <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 mb-2">
                    プリセット名（空欄の場合は「VS相手チャンピオン名」が自動設定されます）
                </label>
                <div className="flex gap-2">
                    <input
                        id="preset-name"
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 ${errors.presetName ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="例: 序盤安定型"
                        aria-invalid={!!errors.presetName}
                        aria-describedby={errors.presetName ? 'preset-name-error' : undefined}
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-800"
                        aria-label="ノートを保存"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
                {errors.presetName && (
                    <p id="preset-name-error" className="text-sm text-red-600 mt-1" role="alert">{errors.presetName}</p>
                )}
            </div>

            {/* サモナースペルと初期アイテムを縦並び */}
            <div className="space-y-6 mb-6">
                {/* サモナースペル選択 */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            サモナースペル
                        </h3>
                        <button
                            onClick={() => setSpells([])}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            リセット
                        </button>
                    </div>
                    <SummonerSpellPicker value={spells} onChange={setSpells} />
                </div>

                {/* 初期アイテム選択 */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            初期アイテム
                        </h3>
                        <button
                            onClick={() => setItems([])}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            リセット
                        </button>
                    </div>
                    <ItemBuildSelector value={items} onChange={setItems} />
                </div>
            </div>

            {/* ルーン選択 */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">ルーン</h3>
                    <button
                        onClick={() => {
                            setRunes(null);
                            setRuneKey(prev => prev + 1); // キーを変更してコンポーネントを強制的に再マウント
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800"
                    >
                        リセット
                    </button>
                </div>
                <RuneSelector key={runeKey} value={runes} onChange={setRunes} />
            </div>

            {/* 対策メモ */}
            <div className="mb-6">
                <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
                    対策メモ
                </label>
                <textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 ${errors.memo ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="対策のポイントやコツを記入してください"
                    aria-invalid={!!errors.memo}
                    aria-describedby={errors.memo ? 'memo-error' : undefined}
                />
                {errors.memo && (
                    <p id="memo-error" className="text-sm text-red-600 mt-1" role="alert">{errors.memo}</p>
                )}
            </div>

            {/* キャンセルボタン */}
            <button
                onClick={onCancel}
                className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-800"
                aria-label="ノート作成をキャンセル"
            >
                キャンセル
            </button>
        </div>
    );
}
