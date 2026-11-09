# AI向け指示

## コンテキスト最小化の原則

**全ての作業において、コンテキスト量を最小限に保ちつつ、有効なプロンプトを心掛けること。**

- Spec/Steeringファイルは簡潔に書く
- 冗長な説明、重複した例は避ける
- 必要最小限の情報のみを記述する
- 詳細な例や説明が必要な場合は、別ファイルへの参照を検討する

## コミット・プッシュ確認の原則

**Git のコミットとプッシュを実行する前に、必ずユーザーに確認を取ること。**

### コミット
- `git commit` を実行する前に、変更内容とコミットメッセージを提示してユーザーの承認を得る
- ユーザーが明示的に「コミットして」と指示した場合のみコミットを実行する
- `git add` でステージングまでは自動で行ってよいが、コミットは必ず確認する

### プッシュ
- `git push` を実行する前に、必ずユーザーに確認を取る
- ユーザーが明示的に「プッシュして」と指示した場合のみプッシュを実行する
- コミット後に自動でプッシュしてはいけない

## 開発ワークフロー

以下の5フェーズを順番に実行する。フェーズのスキップ・順序変更は禁止。次へ進む前にユーザーの承認を得る。

1. 要件定義 → `requirements.md`
2. 設計 → `design.md`
3. テスト仕様 → `design.md` のテスト仕様、テストコード
4. 実装 → `tasks.md`、実装コード
5. レビュー → 修正、steering 更新

- 受け入れ基準はテスト可能な形で書く
- 設計とテスト仕様が揃うまで実装に進まない
- 新しいパターンを導入したら該当する steering を更新する

## Git 規約

- ブランチ: `develop` から `feature/*`（機能）、`fix/*`（バグ修正）、`docs/*`・`chore/*` を作成。急ぎの修正（`hotfix/*`）も `develop` から作成する
- マージ: 作業ブランチ → `develop` → `main` を PR 経由で行う。`main`・`develop` への直接 push 禁止（Rulesets で PR 必須・CI 成功必須。`main` への push ではテストせずデプロイだけが動くため、`develop` を経由しないとテストされないコードがデプロイされる）
- コミットメッセージ: `<type>(<scope>): <日本語の要約>`。type は feat / fix / docs / style / refactor / perf / test / chore
- Issue を解決するコミットは、本文（2行目以降）に `Closes #番号` を書く。`main` に入った時点で Issue が自動で閉じる（`develop` 向け PR の本文の `Closes` は効かないため）

## PR と Issue（GitHub CLI `gh`）

- **AI は PR をマージしてはいけない**（`gh pr merge`、GitHub API でのマージ、`main`・`develop` への直接 push を含む）。マージは必ずユーザーが行う
- PR の作成（`gh pr create`）は、ユーザーの承認を得てから行う。本文は日本語で、変更点・確認結果を書き、関係する Issue があれば `Closes #番号` を入れる
- コミット・push・PR の作成は1つずつ順番に実行する（同時に実行しない。コミットのフックが終わる前に push すると、コミット前の状態が送られる）
- push の後は `git rev-parse HEAD` と `git ls-remote --heads origin <ブランチ>` を比べ、GitHub に正しいコミットが載ったことを確かめてから PR を作る（違えばもう一度 push する。#118）
- タスクの管理は GitHub Issues で行う。後回しにする作業は Issue にし、着手・完了時に Issue のチェックリストを更新する。Issue を閉じるのは、作業の完了をユーザーが確認してから
- Issue・PR の本文にキー・トークン・パスワードなどの秘密情報を書かない（公開リポジトリのため誰でも読める）
- `gh` が PATH にない場合は、PowerShell で `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')` を実行してから使う
