# 実装計画: マイピック

## 概要

参照: `requirements.md`、`design.md`、`../database/design.md`（pick_sheets・pick_sheet_entries）、既存の対策ノート・汎用ノート（`frontend/src/app/notes/`、`components/notes/`、`adapters/supabase/notes.ts`・`generalNotes.ts`）

前提: database Spec タスク15〜16 が完了していること（テーブルがないと保存できない）

## タスク

- [x] 1. データの取得と保存
  - [x] 1.1 `types/myPick.ts`
  - [x] 1.2 `adapters/supabase/pickSheets.ts`（一覧・取得・作成・保存（全件の入れ直し、空の行を除く）・削除）
  - [x] 1.3 `lib/my-pick/`（名前の検証、レーンの表示名、枠の追加（10まで）・削除（詰める）・重複の拒否、検索、入力済みの絞り込み）
  - [x] 1.4 テスト: design.md のテスト方針の `lib/my-pick`・`pickSheets.ts`
    - _要件: 2.5, 3.2〜3.7, 5.1〜5.3_

- [x] 2. ノート画面のタブと URL
  - [x] 2.1 `TabNavigation` に「マイピック」を追加し、`NotesPageContent` で `MyPickTabContent` を出す（サイドバーなし）
  - [x] 2.2 ノート画面がクエリ `tab`・`my`・`enemy` を読んで初期状態にし、タブ・チャンピオンの切り替えでクエリを更新する。`lib/notes/buildNotesHref.ts`
  - [x] 2.3 テスト: クエリでの表示（対策ノートで X vs Y、ノートがなければ「ノートがありません」）、不正な id を無視、リンク先の組み立て
    - _要件: 1.1, 1.2, 4.3, 4.4_

- [x] 3. 一覧と作成
  - [x] 3.1 `usePickSheets`、`PickSheetList`・`PickSheetCard`・`LaneFilter`・`CreatePickSheetDialog`
  - [x] 3.2 テスト: レーンの絞り込み、空の表示、作成ダイアログの検証
    - _要件: 2.1〜2.6_

- [x] 4. 編集
  - [x] 4.1 `usePickSheet`、`PickSheetEditor`・`PickEditRow`・`PickSlot`・`ChampionPickerPopover`・`SheetMetaForm`
  - [x] 4.2 未保存の確認（キャンセル・タブの切り替え・`beforeunload`）
  - [x] 4.3 テスト: 枠の追加と「＋」の無効化、重複の拒否、検索と入力済みの絞り込み、保存で閲覧に移る、未保存の確認
    - _要件: 3.1〜3.10_

- [x] 5. 閲覧と削除
  - [x] 5.1 `PickSheetView`・`PickViewRow`（ピックのアイコンは対策ノートへのリンク）、削除の確認（既存の `DeleteConfirmationDialog`）
  - [x] 5.2 テスト: 入力済みの行だけ、検索、リンク先、削除
    - _要件: 4.1〜4.5_

- [x] 6. チェックポイント: type-check・lint・format-check・test:ci・build を通し、ローカルで作成から閲覧・対策ノートへの移動・削除まで確認する

- [x] 7. デプロイと確認（po とユーザー）
  - [x] 7.1 `main` にマージしてデプロイし、本番で作成・保存・削除と、ピックから対策ノートへの移動を確認する
  - [x] 7.2 汎用ノート「TOP PICK」の内容をマイピックに入れ直す（ユーザー）
