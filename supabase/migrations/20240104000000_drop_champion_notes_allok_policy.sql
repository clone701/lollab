-- champion_notes の "allok" ポリシー削除マイグレーション
-- 説明: ユーザー分離を無効化していた全許可ポリシーを削除する
--
-- 背景:
--   稼働中のDBには以下のポリシーが残っていた。
--     POLICY "allok" ON champion_notes FOR ALL USING (true) WITH CHECK (true)
--
--   PostgreSQLのpermissiveポリシーはOR結合されるため、このポリシーが存在すると
--   "Users can view/create/update/delete their own notes" の
--   auth.uid() = user_id による絞り込みが実質的に無効化される。
--   フロントエンドは NEXT_PUBLIC_SUPABASE_ANON_KEY をブラウザに露出するため、
--   このポリシーが public / anon ロールに適用されている場合、
--   他ユーザーのノートを読み書きできる状態になる。
--
--   開発中の動作確認用に追加されたものと推測されるが、本番に残すべきではない。

DROP POLICY IF EXISTS "allok" ON champion_notes;

-- 削除後、champion_notes に残るポリシーが以下の4つだけであることを確認する:
--   Users can view their own notes    (SELECT)
--   Users can create their own notes  (INSERT)
--   Users can update their own notes  (UPDATE)
--   Users can delete their own notes  (DELETE)
--
-- 確認用クエリ:
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and tablename = 'champion_notes';
