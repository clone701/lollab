// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Supabase clientをグローバルモック（テスト中のact() warning防止）
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockReturnValue(new Promise(() => {})),
      getUser: jest.fn().mockReturnValue(new Promise(() => {})),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));
