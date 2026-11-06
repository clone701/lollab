import { createClient } from '@/lib/supabase/client';

/** Supabase のセッションのアクセストークンを返す。未ログインなら null */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}
