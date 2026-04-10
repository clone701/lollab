/**
 * ノートAPI関数の単体テスト
 * 
 * 注意: このテストを実行するには、Jest と @testing-library/react のセットアップが必要です。
 * また、Supabaseクライアントのモックも必要です。
 */

import { fetchNotes, createNote, updateNote, deleteNote, fetchNote } from '../notes';
import { ChampionNote } from '@/types/note';

// Supabaseクライアントのモック
const mockSupabaseClient = {
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
    })),
};

jest.mock('@/lib/supabase', () => ({
    supabase: mockSupabaseClient,
}));

describe('ノートAPI関数', () => {
    const mockUserId = 'test-user-id';
    const mockNote: ChampionNote = {
        id: 1,
        user_id: mockUserId,
        note_type: 'general',
        my_champion_id: 'Ahri',
        enemy_champion_id: null,
        runes: null,
        spells: null,
        items: null,
        memo: 'テストメモ',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchNotes', () => {
        it('ノート一覧を正常に取得できる', async () => {
            const mockData = [mockNote];

            mockSupabaseClient.from().select().eq().order().mockResolvedValue({
                data: mockData,
                error: null,
            });

            const result = await fetchNotes(mockUserId);

            expect(result).toEqual(mockData);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('champion_notes');
        });

        it('データベースエラー時に適切なエラーメッセージを返す', async () => {
            mockSupabaseClient.from().select().eq().order().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            });

            await expect(fetchNotes(mockUserId)).rejects.toThrow('データベースに接続できませんでした');
        });
    });

    describe('createNote', () => {
        it('ノートを正常に作成できる', async () => {
            const newNote = {
                user_id: mockUserId,
                note_type: 'general' as const,
                my_champion_id: 'Ahri',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: 'テストメモ',
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: mockNote,
                error: null,
            });

            const result = await createNote(newNote);

            expect(result).toEqual(mockNote);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('champion_notes');
        });

        it('バリデーションエラー時に適切なエラーメッセージを返す', async () => {
            const invalidNote = {
                user_id: mockUserId,
                note_type: 'invalid' as 'general' | 'matchup',
                my_champion_id: '',
                enemy_champion_id: null,
                runes: null,
                spells: null,
                items: null,
                memo: '',
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: null,
                error: { message: 'Validation error' },
            });

            await expect(createNote(invalidNote)).rejects.toThrow();
        });
    });

    describe('updateNote', () => {
        it('ノートを正常に更新できる', async () => {
            const updates = { memo: '更新されたメモ' };
            const updatedNote = { ...mockNote, ...updates };

            mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
                data: updatedNote,
                error: null,
            });

            const result = await updateNote(1, updates);

            expect(result.memo).toBe('更新されたメモ');
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('champion_notes');
        });

        it('存在しないノートの更新時にエラーを返す', async () => {
            mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
            });

            await expect(updateNote(999, { memo: 'test' })).rejects.toThrow('ノートが見つかりませんでした');
        });
    });

    describe('deleteNote', () => {
        it('ノートを正常に削除できる', async () => {
            mockSupabaseClient.from().delete().eq.mockResolvedValue({
                data: null,
                error: null,
            });

            await expect(deleteNote(1)).resolves.not.toThrow();
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('champion_notes');
        });

        it('権限エラー時に適切なエラーメッセージを返す', async () => {
            mockSupabaseClient.from().delete().eq.mockResolvedValue({
                data: null,
                error: { code: '42501' },
            });

            await expect(deleteNote(1)).rejects.toThrow('このノートにアクセスする権限がありません');
        });
    });

    describe('fetchNote', () => {
        it('単一ノートを正常に取得できる', async () => {
            mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
                data: mockNote,
                error: null,
            });

            const result = await fetchNote(1, mockUserId);

            expect(result).toEqual(mockNote);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('champion_notes');
        });

        it('存在しないノートの取得時にエラーを返す', async () => {
            mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
            });

            await expect(fetchNote(999, mockUserId)).rejects.toThrow('ノートが見つかりませんでした');
        });

        it('他のユーザーのノート取得時にエラーを返す', async () => {
            mockSupabaseClient.from().select().eq().eq().single.mockResolvedValue({
                data: null,
                error: { code: '42501' },
            });

            await expect(fetchNote(1, 'other-user-id')).rejects.toThrow('このノートにアクセスする権限がありません');
        });
    });

    describe('エラーハンドリング', () => {
        it('ネットワークエラー時に適切なエラーメッセージを返す', async () => {
            mockSupabaseClient.from().select().eq().order().mockResolvedValue({
                data: null,
                error: { message: 'network error occurred' },
            });

            await expect(fetchNotes(mockUserId)).rejects.toThrow('ネットワークエラーが発生しました');
        });
    });
});
