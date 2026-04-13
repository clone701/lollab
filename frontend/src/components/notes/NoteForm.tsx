'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import RuneSelector from './RuneSelector';
import SummonerSpellPicker from './SummonerSpellPicker';
import ItemBuildSelector from './ItemBuildSelector';
import Toast from '@/components/ui/Toast';
import { RuneConfig, ChampionNote } from '@/types/note';
import { createNote, updateNote, NoteUpdateData } from '@/lib/api/notes';
import useToast from '@/lib/hooks/useToast';
import { getChampionById } from '@/lib/utils/championHelpers';

interface NoteFormProps {
    mode: 'create' | 'view' | 'edit';
    myChampionId: string;
    enemyChampionId: string;
    initialData?: ChampionNote;
    onCancel?: () => void;
    onSave?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
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
    mode,
    myChampionId,
    enemyChampionId,
    initialData,
    onCancel,
    onSave,
    onEdit,
    onDelete,
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
    const { user } = useAuth();

    /**
     * initialDataが渡された場合のフォーム初期化
     * 要件: 2.7, 2.8, 2.9, 2.10, 2.11, 3.2
     */
    useEffect(() => {
        if (initialData) {
            setPresetName(initialData.preset_name || '');
            setRunes(initialData.runes);
            setSpells(initialData.spells || []);
            setItems(initialData.items || []);
            setMemo(initialData.memo || '');
            // ルーンコンポーネントを再マウントして初期値を反映
            setRuneKey(prev => prev + 1);
        }
    }, [initialData]);

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

        // サモナースペルの検証（新規作成時・編集時）
        if ((mode === 'create' || mode === 'edit') && spells.length !== 2) {
            newErrors.spells = 'サモナースペルを2つ選択してください';
        }

        // ルーンの検証（新規作成時・編集時）
        if (mode === 'create' || mode === 'edit') {
            if (!runes) {
                newErrors.runes = 'ルーンを選択してください';
            } else {
                // メインルーンの検証
                if (!runes.primaryPath || !runes.keystone || !runes.primaryRunes || runes.primaryRunes.length !== 3) {
                    newErrors.runes = 'メインルーンを全て選択してください';
                }
                // サブルーンの検証
                else if (!runes.secondaryPath || !runes.secondaryRunes || runes.secondaryRunes.length !== 2) {
                    newErrors.runes = 'サブルーンを全て選択してください';
                }
                // ステータスルーン（シャード）の検証
                else if (!runes.shards || runes.shards.length !== 3) {
                    newErrors.runes = 'ステータスルーンを全て選択してください';
                }
            }
        }

        // アイテムの検証（新規作成時・編集時）
        if ((mode === 'create' || mode === 'edit') && items.length === 0) {
            newErrors.items = 'アイテムを少なくとも1つ選択してください';
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
            if (mode === 'edit' && initialData && user) {
                // 編集モード: ノートを更新
                const updateData: NoteUpdateData = {
                    preset_name: finalPresetName,
                    runes,
                    spells,
                    items,
                    memo: memo || null,
                };
                await updateNote(initialData.id.toString(), user.id, updateData);
                showToast('ノートを更新しました', 'success');
            } else {
                // 作成モード: ノートを作成
                await createNote({
                    my_champion_id: myChampionId,
                    enemy_champion_id: enemyChampionId,
                    preset_name: finalPresetName,
                    runes,
                    spells,
                    items,
                    memo: memo || null,
                });
            }

            // 親コンポーネントのonSaveを呼び出し（一覧更新とフォームクローズ）
            if (onSave) {
                onSave();
            }
        } catch (error) {
            // エラートースト表示
            console.error('Failed to save note:', error);
            if (mode === 'edit') {
                showToast('ノートの更新に失敗しました', 'error');
            } else {
                showToast('ノートの作成に失敗しました', 'error');
            }
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

            {/* ヘッダー部分：タイトルとボタン */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'create' ? '新規ノート作成' : mode === 'edit' ? 'ノート編集' : 'ノート詳細'}
                </h2>

                {/* 閲覧モード：編集・削除ボタン */}
                {mode === 'view' && (
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition focus:outline-none focus:ring-2 focus:ring-gray-800"
                            aria-label="ノートを編集"
                        >
                            編集
                        </button>
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="ノートを削除"
                        >
                            削除
                        </button>
                    </div>
                )}
            </div>

            {/* プリセット名入力 */}
            <div className="mb-6">
                <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 mb-2">
                    プリセット名（空欄の場合は「VS相手チャンピオン名」が自動設定されます）
                </label>
                <input
                    id="preset-name"
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 ${errors.presetName ? 'border-red-500' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="例: 序盤安定型"
                    aria-invalid={!!errors.presetName}
                    aria-describedby={errors.presetName ? 'preset-name-error' : undefined}
                />
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
                        {mode !== 'view' && (
                            <button
                                onClick={() => setSpells([])}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                リセット
                            </button>
                        )}
                    </div>
                    <SummonerSpellPicker value={spells} onChange={setSpells} disabled={mode === 'view'} />
                    {errors.spells && (
                        <p className="text-sm text-red-600 mt-1" role="alert">{errors.spells}</p>
                    )}
                </div>

                {/* 初期アイテム選択 */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            初期アイテム
                        </h3>
                        {mode !== 'view' && (
                            <button
                                onClick={() => setItems([])}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                リセット
                            </button>
                        )}
                    </div>
                    <ItemBuildSelector value={items} onChange={setItems} disabled={mode === 'view'} />
                    {errors.items && (
                        <p className="text-sm text-red-600 mt-1" role="alert">{errors.items}</p>
                    )}
                </div>
            </div>

            {/* ルーン選択 */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">ルーン</h3>
                    {mode !== 'view' && (
                        <button
                            onClick={() => {
                                setRunes(null);
                                setRuneKey(prev => prev + 1); // キーを変更してコンポーネントを強制的に再マウント
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            リセット
                        </button>
                    )}
                </div>
                <RuneSelector key={runeKey} value={runes} onChange={setRunes} disabled={mode === 'view'} />
                {errors.runes && (
                    <p className="text-sm text-red-600 mt-1" role="alert">{errors.runes}</p>
                )}
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
                    disabled={mode === 'view'}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 ${errors.memo ? 'border-red-500' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="対策のポイントやコツを記入してください"
                    aria-invalid={!!errors.memo}
                    aria-describedby={errors.memo ? 'memo-error' : undefined}
                />
                {errors.memo && (
                    <p id="memo-error" className="text-sm text-red-600 mt-1" role="alert">{errors.memo}</p>
                )}
            </div>

            {/* ボタン表示（modeに応じて切り替え） */}
            {mode === 'create' && (
                <div className="space-y-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-800"
                        aria-label="ノートを保存"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-800"
                        aria-label="ノート作成をキャンセル"
                    >
                        キャンセル
                    </button>
                </div>
            )}

            {mode === 'edit' && (
                <div className="space-y-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-800"
                        aria-label="ノートを保存"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-800"
                        aria-label="編集をキャンセル"
                    >
                        キャンセル
                    </button>
                </div>
            )}
        </div>
    );
}
