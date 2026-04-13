# 要件定義書

## はじめに

現在、LoL LabではNextAuth.jsを使用してGoogle OAuth認証を実装していますが、Supabase Authとの統合が不完全であり、セキュリティとデータ整合性の問題があります。本機能では、NextAuth.jsからSupabase Authへ完全移行することで、認証システムを一元化し、RLSポリシーを完全に機能させます。

## 用語集

- **Supabase_Auth**: Supabaseが提供する認証サービス（Google OAuthをサポート）
- **RLS**: Row Level Security（行レベルセキュリティ）、Supabaseのデータベースアクセス制御機能
- **NextAuth**: Next.js向けの認証ライブラリ（現在使用中、削除対象）
- **Auth_UUID**: Supabase Authが生成するユーザー固有のUUID（auth.uid()で取得）
- **Session**: ユーザーのログイン状態を保持するオブジェクト
- **Supabase_Client**: Supabaseとの通信を行うクライアントライブラリ

## 要件

### 要件1: Supabase Auth統合

**ユーザーストーリー:** 開発者として、Supabase Authを使用してGoogle OAuth認証を実装したい。これにより、認証システムを一元化し、RLSポリシーが正しく機能するようにする。

#### 受け入れ基準

1. THE Supabase_Client SHALL Google OAuthプロバイダーを使用してユーザー認証を実行する
2. WHEN ユーザーがログインに成功したとき、THE Supabase_Auth SHALL auth.users テーブルにユーザー情報を自動保存する
3. WHEN ユーザーがログインしたとき、THE Application SHALL Supabase Authのセッション情報を取得する
4. THE Application SHALL Supabase Authのセッション状態をReactコンポーネントで利用可能にする
5. WHEN ユーザーがログアウトしたとき、THE Supabase_Client SHALL セッションを完全に破棄する

### 要件2: データベーススキーマ修正

**ユーザーストーリー:** 開発者として、app_usersテーブルを削除し、champion_notesテーブルのuser_idをSupabase AuthのUUIDに変更したい。これにより、RLSポリシーが正しく機能し、データの整合性が保たれる。

#### 受け入れ基準

1. THE Database SHALL app_usersテーブルを削除する
2. THE Database SHALL champion_notesテーブルのuser_idカラムをauth.usersテーブルのidを参照する外部キーに変更する
3. THE Database SHALL champion_notesテーブルの既存RLSポリシーを維持する
4. THE Database SHALL profilesテーブルのidカラムをauth.usersテーブルのidを参照する外部キーに変更する
5. THE Database SHALL 既存のインデックスとトリガーを維持する

### 要件3: 認証UI実装

**ユーザーストーリー:** ユーザーとして、Navbarから簡単にログイン・ログアウトできるようにしたい。これにより、スムーズな認証体験を得られる。

#### 受け入れ基準

1. WHEN ユーザーが未認証のとき、THE Navbar SHALL ログインボタンを表示する
2. WHEN ユーザーがログインボタンをクリックしたとき、THE Application SHALL Supabase AuthのGoogle OAuthフローを開始する
3. WHEN ユーザーが認証済みのとき、THE Navbar SHALL ユーザーアバター画像を表示する
4. WHEN ユーザーがアバター画像をクリックしたとき、THE Navbar SHALL ドロップダウンメニューを表示する
5. WHEN ユーザーがログアウトボタンをクリックしたとき、THE Application SHALL Supabase Authのログアウト処理を実行する
6. THE Navbar SHALL 認証処理中にローディング状態を表示する

### 要件4: セッション管理

**ユーザーストーリー:** ユーザーとして、ページをリロードしてもログイン状態が維持されるようにしたい。これにより、毎回ログインする手間を省ける。

#### 受け入れ基準

1. THE Application SHALL Supabase Authのセッションをブラウザに永続化する
2. WHEN ユーザーがページをリロードしたとき、THE Application SHALL 保存されたセッションを自動的に復元する
3. WHEN セッションが期限切れのとき、THE Application SHALL ユーザーを未認証状態にする
4. THE Application SHALL セッション状態の変更をリアルタイムで検知する

### 要件5: API通信の認証

**ユーザーストーリー:** 開発者として、Supabase Clientを使用したデータベース操作時に、自動的にRLSポリシーが適用されるようにしたい。これにより、ユーザーは自分のデータのみにアクセスできる。

#### 受け入れ基準

1. THE Supabase_Client SHALL 認証済みユーザーのセッショントークンを自動的にリクエストに含める
2. WHEN ユーザーがchampion_notesテーブルにアクセスしたとき、THE Database SHALL RLSポリシーに基づいて自分のデータのみを返す
3. WHEN ユーザーが未認証のとき、THE Database SHALL champion_notesテーブルへのアクセスを拒否する
4. THE Application SHALL データベースエラーを適切にハンドリングする

### 要件6: NextAuth.js削除

**ユーザーストーリー:** 開発者として、NextAuth.js関連のコードと依存関係を完全に削除したい。これにより、コードベースをシンプルに保ち、保守性を向上させる。

#### 受け入れ基準

1. THE Application SHALL NextAuth.jsのAPIルート（`app/api/auth/[...nextauth]/route.ts`）を削除する
2. THE Application SHALL NextAuth.jsのSessionProviderを削除する
3. THE Application SHALL package.jsonからnext-auth依存関係を削除する
4. THE Application SHALL 環境変数からNextAuth関連の設定（NEXTAUTH_SECRET、NEXTAUTH_URL、GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET）を削除する
5. THE Application SHALL 全てのコンポーネントからNextAuth.jsのimportを削除する

### 要件7: 環境変数設定

**ユーザーストーリー:** 開発者として、Supabase Auth用の環境変数を設定したい。これにより、アプリケーションがSupabaseと正しく通信できる。

#### 受け入れ基準

1. THE Application SHALL NEXT_PUBLIC_SUPABASE_URL環境変数を使用してSupabaseプロジェクトURLを設定する
2. THE Application SHALL NEXT_PUBLIC_SUPABASE_ANON_KEY環境変数を使用してSupabase匿名キーを設定する
3. THE Application SHALL .env.local.exampleファイルにSupabase Auth用の環境変数テンプレートを追加する
4. THE Application SHALL 環境変数が未設定の場合、適切なエラーメッセージを表示する

### 要件8: エラーハンドリング

**ユーザーストーリー:** ユーザーとして、認証エラーが発生したときに、わかりやすいエラーメッセージを表示してほしい。これにより、問題を理解し、適切に対処できる。

#### 受け入れ基準

1. WHEN Google OAuth認証が失敗したとき、THE Application SHALL ユーザーにエラーメッセージを表示する
2. WHEN ネットワークエラーが発生したとき、THE Application SHALL 再試行を促すメッセージを表示する
3. WHEN セッションの復元に失敗したとき、THE Application SHALL ユーザーを未認証状態にする
4. THE Application SHALL エラー詳細をコンソールにログ出力する

### 要件9: データ移行

**ユーザーストーリー:** 開発者として、既存のユーザーデータを保持する必要がないことを確認したい。これにより、クリーンな状態でSupabase Authに移行できる。

#### 受け入れ基準

1. THE Migration SHALL app_usersテーブルの既存データを削除する
2. THE Migration SHALL champion_notesテーブルの既存データを削除する
3. THE Migration SHALL profilesテーブルの既存データを削除する
4. THE Application SHALL 移行後、新規ユーザーがSupabase Authで登録できることを確認する
