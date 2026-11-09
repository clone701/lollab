# 実装計画: skill-values

## 概要

参照: `requirements.md`、`design.md`。Issue #132。前提: game-data-tooltip（PR #134）。

## タスク

- [x] 1. 生成スクリプト（`backend/scripts/`）
  - [x] 1.1 `skill_values/`（fetch・strings・calculate・stats・format・render・output）と `build_skill_values.py`
  - [x] 1.2 ステータス番号の表を確定する（数体の計算と、ゲーム内・wiki の表示を見比べる）
  - [x] 1.3 テスト: design.md のテスト仕様の「生成スクリプト」（fixtures を含む）
  - [x] 1.4 16.21.1 で流し、解けた割合と解けなかった上位を po に報告する
    - _要件: 1, 2, 2.5, 3, 5_

- [x] 2. 解けない値への対応（po が 1.4 の結果を見て決める）
  - [x] 2.1 多い理由から対応し、解けるスキルを 80% 以上にする
    - _要件: 5.2_

- [x] 3. 結果のファイル
  - [x] 3.1 `frontend/public/data/skills/*.json` を生成してコミットに含める
  - [x] 3.2 パッチの更新手順を `docs/architecture.md` に書く
    - _要件: 3.2, 3.5_

- [x] 4. 画面のデータ
  - [x] 4.1 `fetchSkillValues`、`toChampionSkills` の `detail`、`useChampionDetail`、`SkillTooltipContent`
  - [x] 4.2 テスト
    - _要件: 4_

- [x] 5. 基礎情報
  - [x] 5.1 `lib/champion-info/`（Lv の計算・表の行・役割名・書き方）
  - [x] 5.2 `champion-info/`（`ChampionInfoPanel`・`TraitBars`・`StatTable`・`SkillList`・`SkillRow`）、`ChampionBuildHeader` の称号と役割
  - [x] 5.3 テスト
    - _要件: 6_

- [x] 6. 検査
  - [x] 6.1 backend: pytest・black・isort・flake8・mypy / frontend: lint・tsc・jest・prettier・build
  - [x] 6.2 po のレビューと、手で確かめること（design.md）

- [ ] 7. デプロイと確認（po とユーザー）
  - [ ] 7.1 `main` にマージしてデプロイし、本番で基礎情報とツールチップの数値を確かめる
