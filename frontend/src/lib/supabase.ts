/**
 * Supabase Client設定
 * 
 * Supabaseデータベースとの通信クライアントを提供します。
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase Client
 * 
 * 環境変数から設定を取得し、Supabaseクライアントを初期化します。
 * RLSポリシーにより、ユーザーは自分のノートのみアクセス可能です。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
