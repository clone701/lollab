/**
 * ノート画面 - URL のクエリでの表示（マイピックのリンク先）
 *
 * 検証項目:
 * 1. tab=matchup&my&enemy で対策ノートの X vs Y が選ばれ、ノートがなければ「ノートがありません」
 * 2. 不正な id は無視して、全ノート一覧を出す
 * 3. tab=mypick でマイピックタブを出す
 */

import { render, screen } from '@testing-library/react';
import { NotesPageContainer } from '../NotesPageContainer';

let query = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(query),
}));

jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    session: { user: { id: 'u1' } },
    loading: false,
  }),
}));

// 汎用ノートは react-markdown（ESM）を使うため、ここではモックする
jest.mock('../GeneralNoteTabContent', () => ({
  GeneralNoteTabContent: () => <div>汎用ノート</div>,
}));

const getNotes = jest.fn();

jest.mock('@/adapters/supabase', () => ({
  getNotes: (...args: unknown[]) => getNotes(...args),
  getAllNotes: jest.fn().mockResolvedValue([]),
  getGeneralNotes: jest.fn().mockResolvedValue([]),
  getPickSheets: jest.fn().mockResolvedValue([]),
  fetchNoteById: jest.fn(),
  deleteNote: jest.fn(),
}));

describe('ノート画面 - URL のクエリ', () => {
  beforeEach(() => {
    getNotes.mockReset();
    getNotes.mockResolvedValue([]);
  });

  it('tab=matchup&my=Ahri&enemy=Zed で、Ahri vs Zed の一覧（ノートなし）が出る', async () => {
    query = 'tab=matchup&my=Ahri&enemy=Zed';
    render(<NotesPageContainer />);

    expect(await screen.findByText('ノートがありません')).toBeInTheDocument();
    expect(screen.getByText('対策ノート一覧')).toBeInTheDocument();
    expect(getNotes).toHaveBeenCalledWith('Ahri', 'Zed');
  });

  it('不正な id は無視して、チャンピオン未選択の画面になる', async () => {
    query = 'tab=matchup&my=NotAChampion&enemy=Zed';
    render(<NotesPageContainer />);

    expect(
      await screen.findByText('チャンピオンを選択してください')
    ).toBeInTheDocument();
    expect(getNotes).not.toHaveBeenCalled();
  });

  it('tab=mypick でマイピックタブが開く', async () => {
    query = 'tab=mypick';
    render(<NotesPageContainer />);

    expect(
      await screen.findByText('マイピック表がありません')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'マイピックタブ' })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('3つのタブが並ぶ', async () => {
    query = '';
    render(<NotesPageContainer />);

    expect(
      await screen.findByRole('button', { name: '対策ノートタブ' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '汎用ノートタブ' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'マイピックタブ' })
    ).toBeInTheDocument();
  });
});
