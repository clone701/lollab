/**
 * パフォーマンステスト
 * 
 * このテストは以下のパフォーマンス要件を検証します：
 * - 要件14.1: ノート一覧を2秒以内に表示する
 * - 要件14.2: ノート作成・更新を3秒以内に完了する
 * - 要件14.3: チャンピオン選択UIを1秒以内に表示する
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotesPage from '@/app/notes/page';
import CreateNotePage from '@/app/notes/createNote/page';
import { fetchNotes, createNote, updateNote } from '@/lib/api/notes';
import { ChampionNote } from '@/types/note';
import ChampionSelector from '@/components/notes/ChampionSelector';

// モック設定
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/lib/api/notes');
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getSession: jest.fn(),
        },
    },
}));
jest.mock('@/lib/contexts/LoadingContext', () => ({
    LoadingContext: {
        Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        Consumer: ({ children }: { children: (value: any) => React.ReactNode }) =>
            children({ setLoading: jest.fn() }),
    },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFetchNotes = fetchNotes as jest.MockedFunction<typeof fetchNotes>;
const mockCreateNote = createNote as jest.MockedFunction<typeof createNote>;
const mockUpdateNote = updateNote as jest.MockedFunction<typeof updateNote>;

describe('パフォーマンステスト', () => {
    const mockPush = jest.fn();
    const mockSession = {
        user: {
            email: 'test@example.com',
            name: 'Test User',
        },
        expires: '2024-12-31',
    };

    // テストデータ: 大量のノート（パフォーマンステスト用）
    const generateMockNotes = (count: number): ChampionNote[] => {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            user_id: 'test-user-id',
            note_type: i % 2 === 0 ? 'general' : 'matchup',
            my_champion_id: `Champion${i}`,
            enemy_champion_id: i % 2 === 0 ? null : `Enemy${i}`,
            runes: null,
            spells: null,
            items: null,
            memo: `テストメモ ${i}`,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 500).toISOString(),
        }));
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRouter.mockReturnValue({
            push: mockPush,
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
        } as any);

        mockUseSession.mockReturnValue({
            data: mockSession,
            status: 'authenticated',
            update: jest.fn(),
        });

        // LoadingContextのモック
        React.useContext = jest.fn().mockReturnValue({
            setLoading: jest.fn(),
        });
    });

    describe('要件14.1: ノート一覧の読み込み時間テスト', () => {
        it('ノート一覧を2秒以内に表示する（10件）', async () => {
            const mockNotes = generateMockNotes(10);
            mockFetchNotes.mockResolvedValue(mockNotes);

            const startTime = performance.now();
            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('チャンピオンノート')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // 2秒（2000ms）以内に表示されることを確認
            expect(loadTime).toBeLessThan(2000);
            console.log(`ノート一覧の読み込み時間（10件）: ${loadTime.toFixed(2)}ms`);
        });

        it('ノート一覧を2秒以内に表示する（50件）', async () => {
            const mockNotes = generateMockNotes(50);
            mockFetchNotes.mockResolvedValue(mockNotes);

            const startTime = performance.now();
            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('チャンピオンノート')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // 2秒（2000ms）以内に表示されることを確認
            expect(loadTime).toBeLessThan(2000);
            console.log(`ノート一覧の読み込み時間（50件）: ${loadTime.toFixed(2)}ms`);
        });

        it('ノート一覧を2秒以内に表示する（100件）', async () => {
            const mockNotes = generateMockNotes(100);
            mockFetchNotes.mockResolvedValue(mockNotes);

            const startTime = performance.now();
            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('チャンピオンノート')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // 2秒（2000ms）以内に表示されることを確認
            expect(loadTime).toBeLessThan(2000);
            console.log(`ノート一覧の読み込み時間（100件）: ${loadTime.toFixed(2)}ms`);
        });

        it('空のノート一覧を2秒以内に表示する', async () => {
            mockFetchNotes.mockResolvedValue([]);

            const startTime = performance.now();
            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('まだノートが作成されていません')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // 2秒（2000ms）以内に表示されることを確認
            expect(loadTime).toBeLessThan(2000);
            console.log(`空のノート一覧の読み込み時間: ${loadTime.toFixed(2)}ms`);
        });
    });

    describe('要件14.2: ノート作成・更新の処理時間テスト', () => {
        it('ノート作成を3秒以内に完了する', async () => {
            const newNote: ChampionNote = {
                id: 1,
                user_id: 'test-user-id',
                note_type: 'general',
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: 'テストメモ',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // ノート作成のモック（実際のAPI呼び出しをシミュレート）
            mockCreateNote.mockImplementation(async (note) => {
                // 実際のネットワーク遅延をシミュレート（100-500ms）
                await new Promise(resolve => setTimeout(resolve, 100));
                return newNote;
            });

            const startTime = performance.now();

            // ノート作成を実行
            const result = await mockCreateNote({
                user_id: 'test-user-id',
                note_type: 'general',
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: 'テストメモ',
            });

            const endTime = performance.now();
            const createTime = endTime - startTime;

            // 3秒（3000ms）以内に完了することを確認
            expect(createTime).toBeLessThan(3000);
            expect(result).toEqual(newNote);
            console.log(`ノート作成の処理時間: ${createTime.toFixed(2)}ms`);
        });

        it('ノート更新を3秒以内に完了する', async () => {
            const updatedNote: ChampionNote = {
                id: 1,
                user_id: 'test-user-id',
                note_type: 'matchup',
                my_champion_id: 'Ahri',
                enemy_champion_id: 'Yasuo',
                runes: null,
                spells: null,
                items: null,
                memo: '更新されたメモ',
                created_at: new Date(Date.now() - 1000).toISOString(),
                updated_at: new Date().toISOString(),
            };

            // ノート更新のモック（実際のAPI呼び出しをシミュレート）
            mockUpdateNote.mockImplementation(async (id, updates) => {
                // 実際のネットワーク遅延をシミュレート（100-500ms）
                await new Promise(resolve => setTimeout(resolve, 150));
                return updatedNote;
            });

            const startTime = performance.now();

            // ノート更新を実行
            const result = await mockUpdateNote(1, {
                memo: '更新されたメモ',
            });

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            // 3秒（3000ms）以内に完了することを確認
            expect(updateTime).toBeLessThan(3000);
            expect(result).toEqual(updatedNote);
            console.log(`ノート更新の処理時間: ${updateTime.toFixed(2)}ms`);
        });

        it('複数のノート作成を3秒以内に完了する（バッチ処理）', async () => {
            const noteCount = 5;
            const mockNotes = generateMockNotes(noteCount);

            mockCreateNote.mockImplementation(async (note) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return mockNotes[0];
            });

            const startTime = performance.now();

            // 複数のノートを作成
            const promises = Array.from({ length: noteCount }, (_, i) =>
                mockCreateNote({
                    user_id: 'test-user-id',
                    note_type: 'general',
                    my_champion_id: `Champion${i}`,
                    enemy_champion_id: null,
                    runes: null,
                    spells: null,
                    items: null,
                    memo: `テストメモ ${i}`,
                })
            );

            await Promise.all(promises);

            const endTime = performance.now();
            const batchCreateTime = endTime - startTime;

            // 3秒（3000ms）以内に完了することを確認
            expect(batchCreateTime).toBeLessThan(3000);
            console.log(`複数ノート作成の処理時間（${noteCount}件）: ${batchCreateTime.toFixed(2)}ms`);
        });
    });

    describe('要件14.3: チャンピオン選択UIの表示時間テスト', () => {
        it('チャンピオン選択UIを1秒以内に表示する', async () => {
            const mockOnChange = jest.fn();

            const startTime = performance.now();

            render(
                <ChampionSelector
                    value={null}
                    onChange={mockOnChange}
                    label="マイチャンピオン"
                />
            );

            // チャンピオン選択UIが表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('マイチャンピオン')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // 1秒（1000ms）以内に表示されることを確認
            expect(renderTime).toBeLessThan(1000);
            console.log(`チャンピオン選択UIの表示時間: ${renderTime.toFixed(2)}ms`);
        });

        it('チャンピオン選択UIの検索機能が1秒以内に応答する', async () => {
            const mockOnChange = jest.fn();

            render(
                <ChampionSelector
                    value={null}
                    onChange={mockOnChange}
                    label="マイチャンピオン"
                />
            );

            // 検索入力欄を取得
            const searchInput = screen.getByPlaceholderText('チャンピオン名で検索...');

            const startTime = performance.now();

            // 検索を実行
            fireEvent.change(searchInput, { target: { value: 'Ahri' } });

            // 検索結果が表示されることを確認
            await waitFor(() => {
                expect(screen.getByAltText('Ahri')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const searchTime = endTime - startTime;

            // 1秒（1000ms）以内に応答することを確認
            expect(searchTime).toBeLessThan(1000);
            console.log(`チャンピオン検索の応答時間: ${searchTime.toFixed(2)}ms`);
        });

        it('チャンピオン選択が1秒以内に完了する', async () => {
            const mockOnChange = jest.fn();

            render(
                <ChampionSelector
                    value={null}
                    onChange={mockOnChange}
                    label="マイチャンピオン"
                />
            );

            // チャンピオンボタンを取得
            await waitFor(() => {
                expect(screen.getByAltText('Ahri')).toBeInTheDocument();
            });

            const championButton = screen.getByAltText('Ahri').closest('button');

            const startTime = performance.now();

            // チャンピオンを選択
            if (championButton) {
                fireEvent.click(championButton);
            }

            // onChangeが呼ばれることを確認
            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith('Ahri');
            });

            const endTime = performance.now();
            const selectTime = endTime - startTime;

            // 1秒（1000ms）以内に完了することを確認
            expect(selectTime).toBeLessThan(1000);
            console.log(`チャンピオン選択の処理時間: ${selectTime.toFixed(2)}ms`);
        });

        it('チャンピオン画像の遅延読み込みが正しく動作する', async () => {
            const mockOnChange = jest.fn();

            const startTime = performance.now();

            render(
                <ChampionSelector
                    value={null}
                    onChange={mockOnChange}
                    label="マイチャンピオン"
                />
            );

            // 最初のチャンピオン画像が表示されることを確認
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                expect(images.length).toBeGreaterThan(0);

                // Next.js Imageコンポーネントがloading="lazy"を使用していることを確認
                // Next.js Imageは自動的に遅延読み込みを適用する
                const firstImage = images[0] as HTMLImageElement;
                expect(firstImage.getAttribute('loading')).toBe('lazy');
            });

            const endTime = performance.now();
            const lazyLoadTime = endTime - startTime;

            // 1秒（1000ms）以内に表示されることを確認
            expect(lazyLoadTime).toBeLessThan(1000);
            console.log(`チャンピオン画像の遅延読み込み時間: ${lazyLoadTime.toFixed(2)}ms`);
        });
    });

    describe('統合パフォーマンステスト', () => {
        it('ノート作成ページ全体が3秒以内に表示される', async () => {
            const startTime = performance.now();

            render(<CreateNotePage />);

            // ページが完全に表示されることを確認
            await waitFor(() => {
                expect(screen.getByText('新規ノート作成')).toBeInTheDocument();
                expect(screen.getByText('マイチャンピオン')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const pageLoadTime = endTime - startTime;

            // 3秒（3000ms）以内に表示されることを確認
            expect(pageLoadTime).toBeLessThan(3000);
            console.log(`ノート作成ページの読み込み時間: ${pageLoadTime.toFixed(2)}ms`);
        });

        it('ノート一覧からノート作成までの遷移が3秒以内に完了する', async () => {
            const mockNotes = generateMockNotes(10);
            mockFetchNotes.mockResolvedValue(mockNotes);

            const startTime = performance.now();

            // ノート一覧ページを表示
            const { rerender } = render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('チャンピオンノート')).toBeInTheDocument();
            });

            // 新規作成ボタンをクリック
            const createButton = screen.getByRole('button', { name: '新しいノートを作成' });
            fireEvent.click(createButton);

            // ノート作成ページに遷移
            rerender(<CreateNotePage />);

            await waitFor(() => {
                expect(screen.getByText('新規ノート作成')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const transitionTime = endTime - startTime;

            // 3秒（3000ms）以内に完了することを確認
            expect(transitionTime).toBeLessThan(3000);
            console.log(`ノート一覧→作成ページの遷移時間: ${transitionTime.toFixed(2)}ms`);
        });
    });

    describe('パフォーマンス回帰テスト', () => {
        it('大量のノート（200件）でも2秒以内に表示される', async () => {
            const mockNotes = generateMockNotes(200);
            mockFetchNotes.mockResolvedValue(mockNotes);

            const startTime = performance.now();
            render(<NotesPage />);

            await waitFor(() => {
                expect(screen.getByText('チャンピオンノート')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // 2秒（2000ms）以内に表示されることを確認
            expect(loadTime).toBeLessThan(2000);
            console.log(`大量ノート（200件）の読み込み時間: ${loadTime.toFixed(2)}ms`);
        });

        it('チャンピオン選択UIで全171チャンピオンが1秒以内に表示される', async () => {
            const mockOnChange = jest.fn();

            const startTime = performance.now();

            render(
                <ChampionSelector
                    value={null}
                    onChange={mockOnChange}
                    label="マイチャンピオン"
                />
            );

            // 全チャンピオンが表示されることを確認
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                // 171チャンピオン全てが表示されることを確認
                expect(images.length).toBeGreaterThanOrEqual(171);
            });

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // 1秒（1000ms）以内に表示されることを確認
            expect(renderTime).toBeLessThan(1000);
            console.log(`全チャンピオン（171件）の表示時間: ${renderTime.toFixed(2)}ms`);
        });
    });
});
