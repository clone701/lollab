/**
 * Supabase Browser Client設定
 *
 * @supabase/ssrを使用したブラウザ用Supabaseクライアントを提供します。
 * Server-Side Rendering対応のクライアント実装です。
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Clientを作成
 *
 * 環境変数から設定を取得し、ブラウザ用Supabaseクライアントを初期化します。
 * RLSポリシーにより、ユーザーは自分のノートのみアクセス可能です。
 *
 * @returns Supabase Browser Client
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
