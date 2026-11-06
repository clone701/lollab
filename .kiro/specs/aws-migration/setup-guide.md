# タスク4 手順書: AWS の初回準備

上から順に進める。画面の名前は日本語表示のもの（英語表示ならかっこ内）。リージョンはすべて **アジアパシフィック（東京）ap-northeast-1**。コンソール右上のリージョンが「東京」になっていることを毎回確認する。

> **注意**: この手順が全部終わるまで `main` にマージしない（`main` への push で AWS へのデプロイが動き、設定が無いと失敗する）。

所要時間の目安: 全体で1〜1.5時間。

---

## 手順1. IAM Identity Center と CLI の設定（約20分）

**目的**: ルートユーザーを日常で使わないように、作業用のユーザーを作る。CLI（PowerShell の `aws` コマンド）もこのユーザーで動かす。

### 1-1. Identity Center を有効にする
1. AWS コンソールにルートユーザーでサインインする
2. 上の検索欄に `IAM Identity Center` と入力して開く
3. 「有効にする」（Enable）を押す
4. 「AWS Organizations で有効にする」を選ぶ（組織が自動で作られる。料金はかからない）
   - 「アカウントインスタンス」は選ばない（AWS アカウントへのログインに使えないため）
5. インスタンスの構成は **「シングルリージョンインスタンス」**（Single-Region instance）を選ぶ
   - 既定の「マルチリージョンインスタンス」は選ばない（KMS のカスタマー管理キーが作られ、月 $1 前後の料金がかかるため）
   - 作成前に、右上のリージョンが「東京」であることを確認する（作成後は変えられない）

### 1-2. ユーザーを作る
1. 左メニュー「ユーザー」（Users）→「ユーザーを追加」
2. 入力
   - ユーザー名: 例 `clone`
   - パスワード: 「パスワードの設定手順が記載された E メールをこのユーザーに送信します」
   - E メールアドレス、名、姓: 自分のもの
3. 「次へ」→ グループは何もせず「次へ」→「ユーザーを追加」
4. 届いたメール「Invitation to join AWS IAM Identity Center」の「Accept invitation」を押し、パスワードを決める
5. MFA の登録を求められたら、スマホの認証アプリ（Google Authenticator など）で登録する
   - 求められなかった場合: メール内のポータル URL からサインイン → 右上のユーザー名 →「MFA デバイス」で登録

### 1-3. 権限を割り当てる
1. Identity Center に戻り、左メニュー「許可セット」（Permission sets）→「許可セットを作成」
2. 「事前定義された許可セット」→ `AdministratorAccess` を選ぶ →「次へ」
3. セッション期間を `4 時間` にする（既定の1時間だと作業中に切れやすい）→「次へ」→「作成」
4. 左メニュー「AWS アカウント」→ 自分のアカウントにチェック →「ユーザーまたはグループを割り当て」
5. 「ユーザー」タブで 1-2 のユーザーを選ぶ →「次へ」→ `AdministratorAccess` を選ぶ →「次へ」→「送信」

### 1-4. ポータル URL を控える
1. Identity Center の「ダッシュボード」右側の「AWS アクセスポータルの URL」（`https://d-xxxxxxxxxx.awsapps.com/start`）をコピーする
2. 以降のコンソール作業は、この URL から作業用ユーザーでサインインして行う（ルートユーザーはサインアウトしてよい）

### 1-5. CLI を設定する
AWS CLI v2 はインストール済み（確認済み）。PowerShell で実行する。

```powershell
aws configure sso --profile lollab
```
質問への答え:

| 質問 | 入力 |
|---|---|
| SSO session name | `lollab` |
| SSO start URL | 1-4 でコピーした URL |
| SSO region | `ap-northeast-1` |
| SSO registration scopes | 何も入力せず Enter |

ブラウザが開くので「アクセスを許可」を押す。続く質問:

| 質問 | 入力 |
|---|---|
| アカウント・ロールの選択 | 1つしかなければ自動で選ばれる。聞かれたら `AdministratorAccess` |
| Default client Region | `ap-northeast-1` |
| CLI default output format | `json` |

確認:
```powershell
aws sts get-caller-identity --profile lollab
```
`"Arn"` に `AWSReservedSSO_AdministratorAccess` が含まれていれば成功。

> 後日コマンドが「トークンの期限切れ」で失敗したら `aws sso login --profile lollab` を実行する。

---

## 手順2. publishable キーへの置き換え（約10分）

**目的**: フロントエンドが使う Supabase のキーを新形式に変える。旧形式（`eyJ...` で始まる anon キー）は Supabase が2026年末までに廃止する。新しい AWS の設定にも新形式を入れる。

### 2-1. キーを確認する
1. Supabase ダッシュボード → 対象プロジェクト → 左下の歯車「Project Settings」→「API Keys」
2. 「Publishable key」の `sb_publishable_...` をコピーする
   - 見当たらなければ「Create new API keys」を押して作る

### 2-2. ローカルを置き換える
1. `frontend/.env.local` を開き、`NEXT_PUBLIC_SUPABASE_ANON_KEY=` の右側を 2-1 の値に置き換えて保存する
2. `npm run dev` を起動し直す（起動中なら Ctrl+C で止めてから）
3. http://localhost:3000 で Google ログインとノートの表示ができることを確認する

### 2-3. Vercel を置き換える
1. Vercel → プロジェクト →「Settings」→「Environment Variables」
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` の「…」→「Edit」→ 値を置き換えて「Save」
3. 「Deployments」→ 一番上のデプロイの「…」→「Redeploy」（`NEXT_PUBLIC_` の値はビルド時に埋め込まれるため、再デプロイが必要）
4. 本番サイトでログインできることを確認する

> 旧形式のキーの無効化は、移行が終わってから行う（今は無効にしない）。

---

## 手順3. CodeConnections で GitHub と接続（約5分）

**目的**: AWS の CodeBuild が GitHub からソースを取得できるようにする。

1. コンソールで次の URL を開く: https://ap-northeast-1.console.aws.amazon.com/codesuite/settings/connections
2. 「接続を作成」→ プロバイダー「GitHub」→ 接続名 `lollab-github` →「GitHub に接続する」
3. GitHub の画面で「Authorize AWS Connector for GitHub」を押す
4. AWS の画面に戻ったら「新しいアプリをインストールする」を押す
5. GitHub の画面で自分のアカウント（`clone701`）を選ぶ →「Only select repositories」→ `lollab` を選ぶ →「Install」
6. AWS の画面に戻り「接続」を押す
7. 接続一覧で状態が **「利用可能」（Available）** になっていることを確認する
8. 接続をクリックし、**ARN**（`arn:aws:codeconnections:ap-northeast-1:数字:connection/英数字`）をメモ帳にコピーしておく

---

## 手順4. 自分の IP とベーシック認証のハッシュを作る（約5分）

**目的**: サイトの入口（第1段階）を通す条件を作る。**許可した IP から来た人、またはベーシック認証のユーザー名とパスワードを知っている人**だけが通れる。IP が変わってもベーシック認証で入れる。

### 4-1. 自分の IP
PowerShell で実行する。
```powershell
(Invoke-WebRequest https://checkip.amazonaws.com -UseBasicParsing).Content.Trim()
```
例 `203.0.113.10` と出たら、後で使う値は末尾に `/32` を付けた `203.0.113.10/32`。メモ帳に控える。

> 自宅の回線が IPv6 で通信している場合、IP では一致せずベーシック認証の入力画面が出る。それで問題はない（ベーシック認証で入れる）。

### 4-2. ベーシック認証のユーザー名・パスワードを決める
- ユーザー名とパスワードを決め、**パスワードマネージャーに保存する**（後で分からなくなると入れない）
- 使える文字: 半角英数字と記号。ユーザー名に `:` は使わない。パスワードは16文字以上を推奨

### 4-3. ハッシュを作る
PowerShell で1行ずつ実行する。1行目でユーザー名とパスワードを `:` でつないで入力する（例 `lollab:MyLongPassword123!`）。

```powershell
$pair = Read-Host 'ユーザー名:パスワード を入力'
$b64  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($pair))
$hash = [Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes("Basic $b64"))
([BitConverter]::ToString($hash) -replace '-','').ToLower()
Remove-Variable pair, b64
```
最後に出る **64文字の英数字** がハッシュ。メモ帳に控える（ハッシュはパスワードそのものではないが、人に送らない）。

---

## 手順5. bootstrap のデプロイ（約10分）

**目的**: デプロイの仕組み一式（GitHub Actions が使うロール、ビルド用の CodeBuild、成果物の置き場所）を AWS に作る。最初の1回だけ手で実行する。

### 5-1. コマンドを用意する
下のコマンドをメモ帳に貼り、`<...>` の4か所を置き換える（`<` と `>` も消す）。

| 置き換える箇所 | 値 |
|---|---|
| `<接続 ARN>` | 手順3-8 |
| `<sb_publishable_...>` | 手順2-1 |
| `<IP>` | 手順4-1 の IP（`/32` はコマンド側に付いている） |
| `<ハッシュ>` | 手順4-3 の64文字 |

```powershell
aws cloudformation deploy --profile lollab --region ap-northeast-1 `
  --template-file infra/bootstrap.yaml --stack-name lollab-bootstrap `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
    CodeConnectionArn=<接続 ARN> `
    NextPublicSupabaseUrl=https://lshjghswtbihnthfkaga.supabase.co `
    NextPublicSupabaseAnonKey=<sb_publishable_...> `
    AppAllowedCidrs=<IP>/32 `
    AppBasicAuthHash=<ハッシュ> `
    AppSupabaseProjectRef=lshjghswtbihnthfkaga
```
行末の `` ` ``（バッククォート）は「次の行に続く」という意味。消さない。後ろに空白も入れない。

### 5-2. 実行する
1. VS Code のターミナル（PowerShell）でリポジトリ直下 `d:\git\lollab` にいることを確認する
2. テンプレートは UTF-8（日本語のコメントを含む）なので、先に次を実行する（実行しないと `'cp932' codec can't decode` のエラーになる。ターミナルを開き直したらもう一度実行する）
   ```powershell
   $env:AWS_CLI_FILE_ENCODING = 'UTF-8'
   ```
3. 5-1 のコマンドを貼って実行する
4. 2〜5分待ち、`Successfully created/updated stack - lollab-bootstrap` と出れば成功

### 5-3. 出力を控える
```powershell
aws cloudformation describe-stacks --profile lollab --region ap-northeast-1 `
  --stack-name lollab-bootstrap --query "Stacks[0].Outputs" --output table
```
`GitHubActionsRoleArn` の値（`arn:aws:iam::数字:role/lollab-github-actions`）を控える。手順7で使う。

### 失敗したとき
次のコマンドで原因を表示し、結果を po に貼る。
```powershell
aws cloudformation describe-stack-events --profile lollab --region ap-northeast-1 `
  --stack-name lollab-bootstrap `
  --query "StackEvents[?contains(ResourceStatus,'FAILED')].[LogicalResourceId,ResourceStatusReason]" --output table
```
初回の作成に失敗した場合、スタックが `ROLLBACK_COMPLETE` で残り、そのままでは再実行できない。原因を直したら、スタックを消してから 5-2 をやり直す。
```powershell
aws cloudformation delete-stack --profile lollab --region ap-northeast-1 --stack-name lollab-bootstrap
```

> 後で IP やハッシュを変えるときは、変える値だけを `--parameter-overrides` に書いて同じコマンドを実行する。書かなかった値は前回のまま。

---

## 手順6. SSM パラメータの登録（約15分）

**目的**: API が使う秘密情報（Riot API キー、Supabase のキーなど）を AWS に保存する。値はコードや設定ファイルに書かず、Lambda が起動時に読む。

### 6-1. （推奨）キーを新しくする
以前のログに Supabase と Riot のキーの値が出たため、ここで新しいキーに替えておく。
- **Supabase**: Project Settings →「API Keys」→ Secret keys の「Add new secret key」→ 新しい `sb_secret_...` をコピー
- **Riot**: https://developer.riotgames.com → 自分のアプリの画面でキーを再発行する
- 新しいキーは、6-2 の登録に加えて、ローカルの `backend/.env` と Render の環境変数（`SUPABASE_KEY`、`RIOT_API_KEY`）にも入れる
- Render とローカルが新しいキーで動くことを確認してから、Supabase の古い secret キーを削除する

### 6-2. パラメータを作る
1. コンソール上の検索欄に `Parameter Store` と入力して開く（Systems Manager の中にある）
2. 「パラメータの作成」を押す
3. 下の表の1行ごとに、次の内容で作る。終わったら「パラメータを作成」を押し、次の行を同じように作る

共通の設定:
- 枠（Tier）: **標準**（無料。「高度」は有料なので選ばない）
- タイプが「安全な文字列」の場合: KMS キーソースは「現在のアカウント」、KMS キー ID は既定の `alias/aws/ssm` のまま

| 名前 | タイプ | 値 |
|---|---|---|
| `/lollab/riot_api_key` | 安全な文字列（SecureString） | Riot の API キー（`RGAPI-...`） |
| `/lollab/supabase_key` | 安全な文字列（SecureString） | Supabase の secret キー（`sb_secret_...`） |
| `/lollab/supabase_url` | 文字列（String） | `https://lshjghswtbihnthfkaga.supabase.co` |
| `/lollab/allowed_emails` | 文字列のリスト（StringList） | ログインに使う Google のメールアドレス。複数なら `,` 区切り（空白なし） |
| `/lollab/supabase_jwt_secret` | 安全な文字列（SecureString） | 下の 6-3 で取得する値 |

名前は1文字でも違うと読み込まれない。先頭の `/` も含めてコピーして使う。

### 6-3. JWT シークレットの取得
1. Supabase → Project Settings →「JWT Keys」
2. 「Legacy JWT Secret」タブ → 値を表示（Reveal）してコピー
3. 6-2 の `/lollab/supabase_jwt_secret` の値に貼る

### 6-4. 確認
```powershell
aws ssm get-parameters-by-path --profile lollab --region ap-northeast-1 --path /lollab `
  --query "Parameters[].[Name,Type]" --output table
```
名前とタイプの5行が出れば成功（値は表示されない）。

---

## 手順7. GitHub Variables の設定（約3分）

**目的**: `main` にマージしたとき、GitHub Actions が AWS のデプロイを起動できるようにする。

1. GitHub のリポジトリ `clone701/lollab` →「Settings」
2. 左メニュー「Secrets and variables」→「Actions」
3. **「Variables」タブ**を開く（「Secrets」タブではない）→「New repository variable」
4. 次の2つを作る

| Name | Value |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | 手順5-3 の `GitHubActionsRoleArn` |
| `AWS_REGION` | `ap-northeast-1` |

---

## 手順8. 本番 DB のマイグレーション（約5分）

**目的**: 新しいコードが使うテーブルと列を本番の Supabase に作る。どのファイルも何度実行しても安全な書き方になっている（既にあれば何もしない）。

### 8-1. 実行する
次のファイルを、**この順で1つずつ**実行する。

1. `supabase/migrations/20261105191256_create_worker_leases.sql`
2. `supabase/migrations/20261106000000_add_failed_matches.sql`
3. `supabase/migrations/20261106000100_add_match_build_data.sql`
4. `supabase/migrations/20261106000200_add_champion_note_runes_id_version.sql`

2と3は適用済みかもしれないが、実行しても問題ない。

1ファイルごとの操作:
1. VS Code でファイルを開き、Ctrl+A → Ctrl+C で全文をコピーする
2. Supabase ダッシュボード → 左メニュー「SQL Editor」→「New query」（＋）
3. 貼り付けて「Run」を押す
4. 下に `Success. No rows returned` と出れば成功。エラーが出たら、そのメッセージを po に貼る

### 8-2. 確認
Supabase の「Table Editor」で次を確認する。
- テーブル一覧に `worker_leases` がある
- `champion_notes` に列 `runes_id_version` がある

### 8-3. まだ実行しないファイル
`20261106000300_migrate_champion_note_rune_ids.sql` は、**新しいコードが AWS にデプロイされた後**（タスク5）に実行する。先に実行すると、古いコードで動いている Vercel の画面でノートのルーンがずれて表示される。

---

## 終わったら

po に「タスク4完了」とだけ伝える（キーやハッシュの値は送らない）。途中で詰まったら、手順の番号とエラーメッセージを貼る。
