/**
 * TabContentPlaceholderコンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TabContentPlaceholder from '../TabContentPlaceholder';

describe('TabContentPlaceholder', () => {
    describe('新規ノート作成タブ', () => {
        it('チャンピオン選択を促すメッセージを表示する', () => {
            render(
                <TabContentPlaceholder
                    tab="create"
                    myChampionId={null}
                    enemyChampionId={null}
                />
            );

            expect(screen.getByText('チャンピオンを選択してください')).toBeInTheDocument();
            expect(screen.getByText('左のパネルで自分のチャンピオンと相手のチャンピオンを選択してください')).toBeInTheDocument();
        });
    });

    describe('汎用ノートタブ', () => {
        it('別Spec実装予定のメッセージを表示する', () => {
            render(
                <TabContentPlaceholder
                    tab="general"
                    myChampionId={null}
                    enemyChampionId={null}
                />
            );

            expect(screen.getByText('汎用ノート機能')).toBeInTheDocument();
            expect(screen.getByText('汎用ノート機能は別Specで実装予定です')).toBeInTheDocument();
        });
    });

    describe('チャンピオン対策ノートタブ', () => {
        it('チャンピオン選択と別Spec実装予定のメッセージを表示する', () => {
            render(
                <TabContentPlaceholder
                    tab="matchup"
                    myChampionId={null}
                    enemyChampionId={null}
                />
            );

            expect(screen.getByText('チャンピオンを選択してください')).toBeInTheDocument();
            expect(screen.getByText('対策ノート一覧機能は別Specで実装予定です')).toBeInTheDocument();
        });
    });
});
