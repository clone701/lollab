import { createClient } from '@/lib/supabase/client';

/**
 * OAuth のコールバックで受け取った code をセッションに交換する。
 *
 * ブラウザ用クライアントは URL の code を自動で交換することがあり、
 * その場合この明示的な交換は「code verifier がない」エラーになる。
 * 自動交換でセッションができていれば成功として扱う。
 */
export async function exchangeCodeForSession(code: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) throw error;
}
