# 実装計画: Supabase Auth移行

## 概要

NextAuth.jsからSupabase Authへの完全移行を実施します。認証システムを一元化し、RLSポリシーを完全に機能させることで、セキュリティとデータ整合性を向上させます。

## 実装順序の重要性

データベーススキーマ変更は破壊的操作を含むため、最初に実行します。その後、認証基盤（AuthContext）を構築し、UIコンポーネントを更新、最後にNextAuth.jsを削除します。

## タスク

- [ ] 1. データベーススキーマ変更とSupabase Dashboard設定
  - [x] 1.1 Supabase Dashboardで Google OAuth設定を有効化
    - Authentication > Providers > Googleを開く
    - Google OAuthを有効化
    - Google Cloud ConsoleでOAuth 2.0クライアントIDを作成
    - Client IDとClient Secretを設定
    - Authorized redirect URIsに`https://your-project.supabase.co/auth/v1/callback`を追加
    - _要件: 1.1, 1.2_
  
  - [x] 1.2 データベーススキーマ変更SQLを実行
    - Supabase Dashboard > SQL Editorで以下を実行:
    - 既存データを削除（開発環境のみ）: `TRUNCATE TABLE champion_notes CASCADE; TRUNCATE TABLE profiles CASCADE;`
    - app_usersテーブルを削除: `DROP TABLE IF EXISTS app_users CASCADE;`
    - champion_notesテーブルのuser_id外部キーをauth.usersに変更
    - profilesテーブルのid外部キーをauth.usersに変更
    - RLSポリシーが維持されていることを確認
    - _要件: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3_

- [x] 2. 認証基盤の構築
  - [x] 2.1 AuthContextの作成
    - `frontend/src/lib/contexts/AuthContext.tsx`を作成
    - AuthContextTypeインターフェースを定義（user, session, loading, signInWithGoogle, signOut）
    - useAuthフックをエクスポート
    - Supabase Authのセッション状態を管理
    - `onAuthStateChange`でセッション変更をリアルタイム検知
    - ローディング状態を管理してUIのちらつきを防止
    - _要件: 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.2 AuthContextProviderの実装
    - `useEffect`でSupabase Authのセッション初期化
    - `getSession()`で既存セッションを復元
    - `signInWithGoogle`関数を実装（`signInWithOAuth({ provider: 'google' })`）
    - `signOut`関数を実装（セッション完全破棄）
    - エラーハンドリングを追加（認証エラー、ネットワークエラー）
    - _要件: 1.1, 1.5, 4.2, 8.1, 8.2, 8.3_
  
  - [x] 2.3 Supabase Clientの確認
    - `frontend/src/lib/supabase/client.ts`を確認
    - `createBrowserClient`を使用してセッション永続化が有効になっていることを確認
    - 環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が設定されていることを確認
    - _要件: 5.1, 7.1, 7.2, 7.4_

- [x] 3. UIコンポーネントの更新
  - [x] 3.1 Navbarコンポーネントの修正
    - `frontend/src/components/Navbar.tsx`を修正
    - NextAuth.jsの`useSession`を削除
    - AuthContextの`useAuth`フックをインポート
    - 未認証時: ログインボタンを表示
    - 認証済み時: ユーザーアバター画像とドロップダウンメニューを表示
    - ログインボタンクリック時: `signInWithGoogle()`を呼び出し
    - ログアウトボタンクリック時: `signOut()`を呼び出し
    - ローディング状態を表示
    - _要件: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 3.2 NotesPageコンポーネントの修正
    - `frontend/src/app/notes/page.tsx`を修正
    - NextAuth.jsの`useSession`を削除
    - AuthContextの`useAuth`フックを使用
    - 未認証時のリダイレクト処理を追加（`useEffect`で`router.push('/login')`）
    - ローディング状態を表示
    - _要件: 1.3, 1.4, 5.3_
  
  - [x] 3.3 NoteFormコンポーネントの修正
    - `frontend/src/components/notes/NoteForm.tsx`を修正
    - NextAuth.jsの依存関係を削除
    - Supabase Clientを使用したデータ作成処理を確認（既存のまま）
    - RLSポリシーによるエラーハンドリングを追加
    - _要件: 5.2, 8.4_
  
  - [x] 3.4 NoteListコンポーネントの修正
    - `frontend/src/components/notes/NoteList.tsx`を修正
    - NextAuth.jsの依存関係を削除
    - Supabase Clientを使用したデータ取得処理を確認（既存のまま）
    - RLSポリシーによるデータフィルタリングを確認
    - _要件: 5.2, 5.4_
  
  - [x] 3.5 RootLayoutの修正
    - `frontend/src/app/layout.tsx`を修正
    - NextAuth.jsの`SessionProvider`を削除
    - AuthContextの`AuthContextProvider`でラップ
    - _要件: 1.4_

- [x] 4. NextAuth.js削除
  - [x] 4.1 NextAuth.js関連ファイルの削除
    - `frontend/src/app/api/auth/[...nextauth]/route.ts`を削除
    - `frontend/src/app/providers.tsx`を削除（AuthContextProviderに置き換え済み）
    - _要件: 6.1, 6.2_
  
  - [x] 4.2 依存関係の削除
    - `frontend/package.json`から`next-auth`を削除
    - `npm install`を実行して依存関係を更新
    - _要件: 6.3_
  
  - [x] 4.3 環境変数の更新
    - `.env.local`からNextAuth関連の環境変数を削除（NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET）
    - `.env.local.example`を更新してSupabase Auth用の環境変数テンプレートを追加
    - Supabase環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が設定されていることを確認
    - _要件: 6.4, 6.5, 7.3_

- [ ] 5. 動作確認とテスト
  - [x] 5.1 認証フローの動作確認
    - ログインボタンをクリックしてGoogle OAuth認証が開始されることを確認
    - 認証成功後、ユーザー情報（アバター画像）が表示されることを確認
    - ページリロード後もログイン状態が維持されることを確認
    - ログアウトボタンをクリックして未認証状態に戻ることを確認
    - _要件: 1.1, 1.2, 1.3, 1.5, 4.1, 4.2, 9.4_
  
  - [x] 5.2 データアクセスの動作確認
    - 認証済みユーザーがノートを作成できることを確認
    - 作成したノートが一覧に表示されることを確認
    - 別のユーザーでログインして、他のユーザーのノートが表示されないことを確認
    - 未認証ユーザーがノートページにアクセスするとリダイレクトされることを確認
    - _要件: 5.1, 5.2, 5.3_
  
  - [x] 5.3 エラーハンドリングの動作確認
    - Google OAuth認証失敗時にエラーメッセージが表示されることを確認
    - ネットワークエラー時に適切なエラーメッセージが表示されることを確認
    - セッション復元失敗時に未認証状態に遷移することを確認
    - RLSポリシーエラー時に適切なエラーメッセージが表示されることを確認
    - _要件: 8.1, 8.2, 8.3, 8.4_

- [ ] 6. 最終チェックポイント
  - 全ての動作確認が完了したことを確認
  - NextAuth.js関連のコードが完全に削除されたことを確認
  - Supabase Authが正常に動作していることを確認
  - 質問があればユーザーに確認

## 注意事項

- **データベース変更は破壊的操作**: タスク1.2で既存データが削除されます（開発環境のみ）
- **Supabase Dashboard設定が必須**: タスク1.1を最初に実行してください
- **環境変数の確認**: Supabase環境変数が正しく設定されていることを確認してください
- **段階的な実装**: 各タスクを順番に実行し、動作確認を行ってください
- **エラーハンドリング**: 認証エラーやネットワークエラーに対する適切な処理を実装してください

## 実装後の確認事項

- [ ] Google OAuthログインが正常に動作する
- [ ] ログイン後、ユーザー情報が表示される
- [ ] ページリロード後もログイン状態が維持される
- [ ] ログアウトが正常に動作する
- [ ] 未認証時にノートページにアクセスするとリダイレクトされる
- [ ] 認証済みユーザーがノートを作成できる
- [ ] 作成したノートが一覧に表示される
- [ ] 他のユーザーのノートは表示されない
- [ ] エラーメッセージが適切に表示される
- [ ] NextAuth.js関連のコードが完全に削除されている
