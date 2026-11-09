# 実装計画: game-data-tooltip

## 概要

参照: `requirements.md`、`design.md`。Issue #128。

## タスク

- [x] 1. データのコピー（po）
  - [x] 1.1 `D:\dev\16.21.1` から `frontend/public/images/data/ja_JP/`（item・runesReforged・summoner・champion/*）と `img/spell/`・`img/passive/` へコピー
  - [x] 1.2 steering `structure.md` に `public/images/` のフォルダ構成の決まりを追記

- [x] 2. 純粋関数（`lib/game-data/`・`lib/tooltip/`）
  - [x] 2.1 `types.ts`、`parseDescription`、`toItemInfo`・`toRuneInfo`・`toSpellInfo`・`toChampionSkills`、`formatCooldown`・`formatCost`、`toDdragonChampionKey`
  - [x] 2.2 `calcTooltipPosition`
  - [x] 2.3 テスト: design.md のテスト仕様の「純粋関数」（fixtures を含む）
    - _要件: 1.3, 2.1〜2.3, 3.1, 3.2, 4.1, 5.1, 5.3〜5.5, 7.1_

- [x] 3. 取得（`adapters/game-data/`）
  - [x] 3.1 `loadOnce`、`fetchItemData`・`fetchRuneData`・`fetchSummonerData`・`fetchChampionData`
  - [x] 3.2 テスト: design.md のテスト仕様の「取得」
    - _要件: 1.6, 5.1_

- [x] 4. 汎用ツールチップ（`components/ui/tooltip/`）
  - [x] 4.1 `Tooltip`・`useTooltip`・`TooltipPanel`
  - [x] 4.2 テスト: `Tooltip`
    - _要件: 1.1〜1.4_

- [x] 5. ゲームデータの部品（`components/game-data/`）
  - [x] 5.1 `BuildIcon` に `showTitle` を追加
  - [x] 5.2 `useItemData`・`useRuneData`・`useSummonerData`・`useChampionSkills`、`DescriptionText`、内容の部品
  - [x] 5.3 `ItemTooltipIcon`・`RuneTooltipIcon`・`SpellTooltipIcon`・`SkillIcon`
  - [x] 5.4 テスト: 各アイコン・`SkillIcon`
    - _要件: 1.5, 1.6, 2〜5, 7.2_

- [x] 6. 画面への組み込み
  - [x] 6.1 アイテム・ルーン・スペル: design.md の「変更する画面」の表のとおり
  - [x] 6.2 スキル: `SkillPanel`・`SkillOrderGrid`・`SkillOrderView`・`SkillLevelList`、`ChampionBuildBody`・`BuildDetails` から渡す
  - [x] 6.3 テスト: `SkillPanel`・`SkillOrderGrid`・`SkillLevelList`、既存の画面のテストを直す
    - _要件: 5.1, 5.2, 5.5, 6, 8.3_

- [x] 7. 検査
  - [x] 7.1 lint・tsc・jest・prettier・build
  - [x] 7.2 po のレビュー

- [ ] 8. デプロイと確認（po とユーザー）
  - [ ] 8.1 `main` にマージしてデプロイし、design.md の「手で確かめること」を確認する
