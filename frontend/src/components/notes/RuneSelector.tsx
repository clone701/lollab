'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import {
    RUNE_PATHS,
    getKeystones,
    getPrimaryRunes,
    getSecondaryRunes,
    getShards,
    getRuneSlot,
} from '@/lib/data/runes';

interface RuneConfig {
    primaryPath: number;
    secondaryPath: number;
    keystone: number;
    primaryRunes: number[];
    secondaryRunes: number[];
    shards: number[];
}

interface RuneSelectorProps {
    value: RuneConfig | null;
    onChange: (runes: RuneConfig) => void;
    disabled?: boolean;
}

/**
 * RuneSelector - ルーン選択UIコンポーネント
 * 
 * パフォーマンス最適化:
 * - React.memoでメモ化（propsが変わらない限り再レンダリングしない）
 * - useCallbackでイベントハンドラーをメモ化
 * - 画像に loading="lazy" を追加して遅延読み込み
 */
function RuneSelector({ value, onChange, disabled = false }: RuneSelectorProps) {
    const [primaryPath, setPrimaryPath] = useState<number | null>(value?.primaryPath || null);
    const [secondaryPath, setSecondaryPath] = useState<number | null>(value?.secondaryPath || null);
    const [keystone, setKeystone] = useState<number | null>(value?.keystone || null);
    const [primaryRunes, setPrimaryRunes] = useState<number[]>(value?.primaryRunes || []);
    const [secondaryRunes, setSecondaryRunes] = useState<number[]>(value?.secondaryRunes || []);
    const [shards, setShards] = useState<number[]>(value?.shards || []);

    // valueがnullになった時に全ての状態をリセット
    useEffect(() => {
        if (value === null) {
            setPrimaryPath(null);
            setSecondaryPath(null);
            setKeystone(null);
            setPrimaryRunes([]);
            setSecondaryRunes([]);
            setShards([]);
        }
    }, [value]);

    // イベントハンドラーをuseCallbackでメモ化
    const handlePrimaryPathChange = useCallback((pathId: number) => {
        setPrimaryPath(pathId);
        // メインパス変更時にキーストーンとメインルーンをリセット
        setKeystone(null);
        setPrimaryRunes([]);
        // サブパスが同じ場合はリセット
        setSecondaryPath(prev => prev === pathId ? null : prev);
        setSecondaryRunes(prev => prev === pathId ? [] : prev);
    }, []);

    const handleSecondaryPathChange = useCallback((pathId: number) => {
        setSecondaryPath(pathId);
        // サブパス変更時にサブルーンをリセット
        setSecondaryRunes([]);
    }, []);

    const handlePrimaryRuneChange = useCallback((slot: number, runeId: number) => {
        setPrimaryRunes(prev => {
            const newRunes = [...prev];
            newRunes[slot] = runeId;
            return newRunes;
        });
    }, []);

    const handleSecondaryRuneToggle = useCallback((runeId: number) => {
        if (!secondaryPath) return;

        setSecondaryRunes(prev => {
            // クリックされたルーンの行を取得
            const clickedSlot = getRuneSlot(secondaryPath, runeId);
            if (clickedSlot === null) return prev;

            // 既に選択されているルーンの行を取得
            const selectedSlots = prev.map(id => getRuneSlot(secondaryPath, id));

            if (prev.includes(runeId)) {
                // 選択済みなら解除
                return prev.filter(id => id !== runeId);
            } else if (prev.length < 2) {
                // 2つ未満の場合
                if (selectedSlots.includes(clickedSlot)) {
                    // 同じ行のルーンが既に選択されている場合は置き換え
                    return prev.map(id => {
                        const slot = getRuneSlot(secondaryPath, id);
                        return slot === clickedSlot ? runeId : id;
                    });
                } else {
                    // 異なる行なら追加
                    return [...prev, runeId];
                }
            } else {
                // 2つ選択済みの場合
                if (selectedSlots.includes(clickedSlot)) {
                    // 同じ行のルーンが既に選択されている場合は置き換え
                    return prev.map(id => {
                        const slot = getRuneSlot(secondaryPath, id);
                        return slot === clickedSlot ? runeId : id;
                    });
                } else {
                    // 異なる行の場合は最初のルーンを置き換え
                    return [prev[1], runeId];
                }
            }
        });
    }, [secondaryPath]);

    const handleShardChange = useCallback((slot: number, shardId: number) => {
        setShards(prev => {
            const newShards = [...prev];
            newShards[slot] = shardId;
            return newShards;
        });
    }, []);

    // 変更時にonChangeを呼び出す
    useEffect(() => {
        if (
            primaryPath &&
            secondaryPath &&
            keystone &&
            primaryRunes.length === 3 &&
            secondaryRunes.length === 2 &&
            shards.length === 3
        ) {
            onChange({
                primaryPath,
                secondaryPath,
                keystone,
                primaryRunes,
                secondaryRunes,
                shards,
            });
        }
    }, [primaryPath, secondaryPath, keystone, primaryRunes, secondaryRunes, shards, onChange]);

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primary */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Primary</h4>

                    {/* メインルーンパス選択 */}
                    <div className="mb-4">
                        <div className="flex gap-2 flex-wrap">
                            {RUNE_PATHS.map((path) => (
                                <button
                                    key={path.id}
                                    onClick={() => handlePrimaryPathChange(path.id)}
                                    disabled={disabled}
                                    className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${primaryPath === path.id
                                        ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                        : disabled
                                            ? 'opacity-50 cursor-not-allowed bg-white'
                                            : 'hover:ring-2 hover:ring-gray-300 bg-white'
                                        }`}
                                    aria-label={`メインルーンパス: ${path.name}`}
                                    aria-pressed={primaryPath === path.id}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={path.icon} alt={path.name} className="w-8 h-8" width={32} height={32} loading="lazy" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* キーストーン選択 */}
                    {primaryPath && (
                        <div className="mb-4">
                            <div className="grid grid-cols-4 gap-2">
                                {getKeystones(primaryPath).map((rune) => (
                                    <button
                                        key={rune.id}
                                        onClick={() => setKeystone(rune.id)}
                                        disabled={disabled}
                                        className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${keystone === rune.id
                                            ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                            : disabled
                                                ? 'opacity-50 cursor-not-allowed bg-white'
                                                : 'hover:ring-2 hover:ring-gray-300 bg-white'
                                            }`}
                                        aria-label={`キーストーン: ${rune.name}`}
                                        aria-pressed={keystone === rune.id}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={rune.icon} alt={rune.name} className="w-10 h-10" width={40} height={40} loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* メインルーン選択（3段階） */}
                    {primaryPath && (
                        <div className="space-y-2">
                            {[0, 1, 2].map((slot) => (
                                <div key={slot} className="grid grid-cols-3 gap-2">
                                    {getPrimaryRunes(primaryPath, slot).map((rune) => (
                                        <button
                                            key={rune.id}
                                            onClick={() => handlePrimaryRuneChange(slot, rune.id)}
                                            disabled={disabled}
                                            className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${primaryRunes[slot] === rune.id
                                                ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                                : disabled
                                                    ? 'opacity-50 cursor-not-allowed bg-white'
                                                    : 'hover:ring-2 hover:ring-gray-300 bg-white'
                                                }`}
                                            aria-label={`メインルーン ${slot + 1}: ${rune.name}`}
                                            aria-pressed={primaryRunes[slot] === rune.id}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={rune.icon} alt={rune.name} className="w-10 h-10" width={40} height={40} loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Secondary */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Secondary</h4>

                    {/* サブルーンパス選択 */}
                    {primaryPath && (
                        <div className="mb-4">
                            <div className="flex gap-2 flex-wrap">
                                {RUNE_PATHS.filter((p) => p.id !== primaryPath).map((path) => (
                                    <button
                                        key={path.id}
                                        onClick={() => handleSecondaryPathChange(path.id)}
                                        disabled={disabled}
                                        className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${secondaryPath === path.id
                                            ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                            : disabled
                                                ? 'opacity-50 cursor-not-allowed bg-white'
                                                : 'hover:ring-2 hover:ring-gray-300 bg-white'
                                            }`}
                                        aria-label={`サブルーンパス: ${path.name}`}
                                        aria-pressed={secondaryPath === path.id}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={path.icon} alt={path.name} className="w-8 h-8" width={32} height={32} loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* サブルーン選択（2つ） */}
                    {secondaryPath && (
                        <div className="grid grid-cols-3 gap-2">
                            {getSecondaryRunes(secondaryPath).map((rune) => (
                                <button
                                    key={rune.id}
                                    onClick={() => handleSecondaryRuneToggle(rune.id)}
                                    disabled={disabled}
                                    className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${secondaryRunes.includes(rune.id)
                                        ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                        : disabled
                                            ? 'opacity-50 cursor-not-allowed bg-white'
                                            : 'hover:ring-2 hover:ring-gray-300 bg-white'
                                        }`}
                                    aria-label={`サブルーン: ${rune.name}`}
                                    aria-pressed={secondaryRunes.includes(rune.id)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={rune.icon} alt={rune.name} className="w-10 h-10" width={40} height={40} loading="lazy" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shards */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Shards</h4>
                    <div className="space-y-2">
                        {[0, 1, 2].map((slot) => (
                            <div key={slot} className="flex gap-2">
                                {getShards(slot).map((shard) => (
                                    <button
                                        key={shard.id}
                                        onClick={() => handleShardChange(slot, shard.id)}
                                        disabled={disabled}
                                        className={`p-1 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${shards[slot] === shard.id
                                            ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20 bg-blue-50'
                                            : disabled
                                                ? 'opacity-50 cursor-not-allowed bg-white'
                                                : 'hover:ring-2 hover:ring-gray-300 bg-white'
                                            }`}
                                        aria-label={`${['攻撃', 'フレックス', '防御'][slot]}シャード: ${shard.name}`}
                                        aria-pressed={shards[slot] === shard.id}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={shard.icon} alt={shard.name} className="w-8 h-8" width={32} height={32} loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// React.memoでメモ化してパフォーマンス最適化
export default memo(RuneSelector);
