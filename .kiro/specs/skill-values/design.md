# 設計: skill-values

要件: `requirements.md`。Issue #132。前提: game-data-tooltip（#128、PR #134）。

## 全体の流れ

```
[パッチのとき・手で実行]
D:\dev\16.21.1（Data Dragon）──┐
CommunityDragon 16.21 ─────────┼→ backend/scripts/build_skill_values.py
  ・characters/<名前>.bin.json  │     （計算して日本語の説明文に値を入れる）
  ・ja_jp の lol.stringtable    │
                               └→ frontend/public/data/skills/<Key>.json（173ファイル）

[画面]
ビルド画面・試合詳細 → useChampionDetail(championId)
  → /images/data/ja_JP/champion/<Key>.json（基礎情報・スキル名・画像。既存）
  → /data/skills/<Key>.json（数値入りの説明文。新規）
  → 基礎情報カード・スキルのツールチップ
```

## 生成スクリプト（`backend/scripts/`）

`backend/scripts/` は Lambda の ZIP に入らない（`buildspec.yml` は adapters・api・lambda_handlers・schemas・services・utils だけを入れる）。テスト・black・mypy は backend の既存の設定で動く。依存は標準ライブラリだけ（`urllib`・`json`）。

```
backend/scripts/build_skill_values.py       # 入口（引数の読み取り・全体の実行・集計の表示）
backend/scripts/skill_values/
  fetch.py        # CommunityDragon の取得とキャッシュ
  strings.py      # 文字列表の読み取り・{{参照}} の置き換え
  calculate.py    # GameCalculation をランクごと・レベルごとの値にする
  stats.py        # mStat・mStatFormula → 日本語のステータス名
  format.py       # 値の書き方（/ でつなぐ・〜・小数・%）
  render.py       # 説明文の @値@ を置き換える。解けなければ None
  output.py       # 結果のファイルの形と書き出し（並び順・改行を固定）
```

### 実行

```
python backend/scripts/build_skill_values.py D:\dev\16.21.1 --cache D:\dev\cdragon
```

- 版は Data Dragon のフォルダ名から決める（`16.21.1` → CommunityDragon の `16.21`）
- 取得したファイルは `--cache\<版>\` に置き、次の実行では取得しない（173体で数百MB。リポジトリには置かない）
- 最後に表示: 解けたスキル数／全体と割合（パッシブ・スキル別）、解けなかった値の名前の上位20

### 入力

| 使うもの | 場所 | 中身 |
|---|---|---|
| チャンピオン一覧・`Key` | `D:\dev\<版>\data\ja_JP\champion\*.json` | ファイル名（`MonkeyKing` など）と、`spells[].id`・`maxrank` |
| スキルの計算 | `game/data/characters/<小文字>/<小文字>.bin.json` | `Characters/<名前>/Spells/<スペル名>` の `mSpell`（`DataValues`・`mSpellCalculations`・`mClientData.mTooltipData.mLocKeys.keyTooltip`） |
| 日本語の文 | `game/ja_jp/data/menu/en_us/lol.stringtable.json` | `entries`（キーは小文字）。`keyTooltip` のキーで引く |

- スキルの `mSpell` は `spells[].id`（例 `UrgotQ`）で、パッシブは `<名前>PassiveAbility` の下の `mSpell` で探す（見つからなければ `mLocKeys.keyTooltip` が `spell_<名前>passive_tooltip` のもの）
- 文の中の `{{Spell_UrgotW_Name}}` は文字列表で引いて置き換える（入れ子は3回まで）

### 計算（`calculate.py`）

値は「ランク（またはレベル）ごとの数の列」と「ステータスで増える分の一覧」の組にする。

| 部品（`__type`） | 結果 |
|---|---|
| `NamedDataValueCalculationPart` | `DataValues` の `values[1..maxrank]` |
| `NumberCalculationPart` | `mNumber`（全ランク同じ） |
| `StatByCoefficientCalculationPart` | 増える分: `mCoefficient` × ステータス（`mStat`・`mStatFormula`） |
| `StatByNamedDataValueCalculationPart` | 増える分: `DataValues` の値 × ステータス |
| `SumOfSubPartsCalculationPart` | 中の部品の和 |
| `ProductOfSubPartsCalculationPart` | 2つの部品の積（片方が数だけのとき） |
| `ByCharLevelInterpolationCalculationPart` | レベル1〜18で `mStartValue`→`mEndValue`。最小〜最大 |
| `ByCharLevelBreakpointsCalculationPart` | レベル1の値と、ブレークポイントごとの増加。最小〜最大 |
| `GameCalculationModified` | 元の計算 × `mMultiplier` |
| `GameCalculation` | `mFormulaParts` の和。`mMultiplier` があれば掛ける。`mDisplayAsPercent` なら ×100 して `%` |

- 上以外の部品が1つでもあれば、その値は解けない
- `@SlowAmount*100@` のような式は、名前の後ろの `*数`・`/数`・`+数`・`-数` を1つだけ計算する
- 名前は大文字・小文字を区別せずに、`mSpellCalculations` → `DataValues` の順で探す
- `@SpellModifierDescriptionAppend@` など、名前が `SpellModifier` で始まるものは空にする

### ステータス名（`stats.py`）

`mStat` の番号と `mStatFormula`（無し=合計、1=基礎、2=増加）の組を日本語にする（例: 2・無し → 攻撃力、2・2 → 増加攻撃力、0 → 魔力、12・2 → 増加体力）。番号の表は、実装のときに数体の計算とゲーム内の表示を見比べて確定し、テストに残す。表に無い番号は解けない扱い。

### 書き方（`format.py`）

- ランクの列: 全部同じなら1つ、違えば `/` でつなぐ（`25/70/115/160/205`）
- レベルの範囲: `レベル1の値〜レベル18の値`（`20〜100`、`30〜2.5`）
- % の値に増える分: `25% (+魔力100ごとに4%)`（係数 × 100 × 100 を「100ごとに」で出す）
- スタック（`BuffCounterBy…CalculationPart`）: `1スタックにつき X`
- 文の中の `%i:…%` は取り除く。`*-100` のような負の数の式も読む
- `@X@%`（直後に `%`）: `%` を値の側に付ける（`最大体力の8% (+魔力100ごとに4%)`）。ステータスの割合だけの値は `魔力の10%` のまま（`%` を重ねない）
- 攻撃速度・増加攻撃速度・クリティカル率（1.0 が 100%）は「100%ごとに」（`増加攻撃速度100%ごとに5%`）
- `{{参照}}` の中の `@GameModeInteger@` は、サモナーズリフトの値（`1`。文字列表の `_1` がサモナーズリフト、`_2` がアリーナ）として参照先を決める
- パッシブの文の候補の順: スペルの `keyTooltip` の文を計算 → `game_character_passivedescription_<名前>`（`@` が残らなければそのまま）→ 概要
- 小数: 小数第2位で四捨五入し、末尾の 0 と `.` を取る（`9.50` → `9.5`）
- 増える分: `(+攻撃力の70%)`。複数は `(+攻撃力の70% +増加体力の15%)`
- 結果の文は文字列表の文のタグ（`<physicalDamage>` など）をそのまま残す

### 結果のファイル（`frontend/public/data/skills/<Key>.json`）

```json
{
  "version": "16.21.1",
  "passive": "…<physicalDamage>12〜50 (+最大体力の2〜6%)の物理ダメージ</physicalDamage>…",
  "spells": ["榴弾を発射して<physicalDamage>25/70/115/160/205 (+攻撃力の70%)の物理ダメージ</physicalDamage>…", null, "…", "…"]
}
```

- `spells` は Q/W/E/R の順。解けないスキルは `null`
- キーの順・インデント（2）・末尾の改行を固定し、`ensure_ascii=False` で日本語のまま書く
- 置き場所は `public/images/` の外（ダウンロードしたものではなく、生成したもののため）

## 画面

### データの取得
- `adapters/game-data/fetchSkillValues(championId)`: `/data/skills/<Key>.json`（`loadOnce`）。404 は `null`
- `lib/game-data/toChampionSkills` に、結果のファイルを2つ目の引数で受け取り、`SkillInfo.detail`（数値入りの文。無ければ `null`）を足す
- `components/game-data/useChampionSkills` を `useChampionDetail(championId)` に広げる: チャンピオンの JSON と結果のファイルを並べて取り、`{ skills, champion }` を返す（結果のファイルが失敗しても `skills` は出す）
- `SkillTooltipContent` は `detail ?? description` を出す

### 基礎情報（`components/champion-build/champion-info/`）
- `ChampionInfoPanel`: カード。見出し「基礎情報」と開閉ボタン（`aria-expanded`・`aria-controls`。最初は開く）
- `TraitBars`: 攻撃・防御・魔力・難易度の横棒（0〜10。色は `game-physical`・`game-heal`・`game-magic`・`game-status`。`role="meter"`・`aria-valuenow`）
- `StatTable`: 2列の表（`md:grid-cols-2`、狭い画面は1列）。見出し行は `bg-surface-2`。Lv.18 は `font-semibold text-game-number`
- `SkillList`・`SkillRow`: アイコン（`SkillIcon`、40px）、キー、名前（`text-highlight`）、CD・コスト・射程、説明文（`DescriptionText`）。Q と同じ形でパッシブも出す（パッシブは CD・コスト・射程なし）
- `ChampionBuildHeader`: 名前の横に称号（`text-fg-muted`）と役割（`rounded-full border border-line-strong bg-surface-2 px-2 text-xs` の札）

### 計算（`lib/champion-info/`）
- `calcStatAtLevel(base, growth, level)`・`calcAttackSpeedAtLevel(base, growthPercent, level)`: 要件6.4 の式
- `toStatRows(stats, partype)`: 表の行（名前・Lv.1・成長・Lv.18 の文字）。リソースが `なし` なら行を除く。移動速度・射程は成長・Lv.18 なし
- `toRoleLabel(tag)`: `Fighter` → `ファイター` など。知らない値はそのまま
- `formatStat(n)`: 小数第2位まで、末尾の0なし。攻撃速度は第3位まで

## 決めたこと

- 文は Data Dragon の `tooltip` ではなく CommunityDragon の文字列表を使う。パッシブの文はここにしか無く、スキルと同じ書き方（`@値@`）でそろえられるため。版は Data Dragon と合わせる
- 計算は Python のスクリプト（`backend/scripts/`）で行う。backend の検査（pytest・black・mypy）がそのまま使え、Lambda の ZIP には入らない
- 結果のファイルは画面用の文だけを置く。元データ（数百MB）はリポジトリに入れない
- 基礎情報のデータは、既にあるチャンピオンの JSON を使う（新しく取らない）

## テスト仕様

### 生成スクリプト（pytest。ネットワークを使わない）

テストデータは `backend/tests/fixtures/skill_values/` に、CommunityDragon と文字列表から必要な部分だけを抜いた小さい JSON を置く（アーゴット・アーリ・ジンクスと、計算の部品の種類ごとの最小の例）。

| 対象 | 確かめること | 要件 |
|---|---|---|
| `calculate` | 部品の種類ごと（表の全行）の値 / 入れ子（和の中の積など） / `mMultiplier`・`mDisplayAsPercent` / 知らない部品は解けない / `values` の 0 番目は使わず 1〜maxrank を使う | 1.2〜1.4, 2.5.3 |
| `calculate`（ゲームの値） | アーゴット Q: `25/70/115/160/205 (+攻撃力の70%)`・スロウ `45/50/55/60/65` / アーゴット E のシールド / アーリ Q / ジンクス W / アーゴットのパッシブのレベルの範囲。値は wiki・ゲーム内の表示と見比べて決める | 5.1 |
| `stats` | 確定した番号の表の全行 / 表に無い番号は解けない | 1.3 |
| `format` | 全部同じなら1つ / `/` でつなぐ / `〜` / 小数第2位で四捨五入・末尾の0を取る（`9.5`・`0.625` は `0.63`）/ `%` / 増える分が複数 | 1.2, 1.5 |
| `render` | `@名前@` を置き換える / 大文字・小文字を区別しない / `@名前*100@`・`/`・`+`・`-` / `SpellModifier…` は空 / 1つでも解けなければ `None` / タグは残る | 1.1, 1.4, 1.6, 2.1, 2.2 |
| `strings` | `{{Spell_UrgotW_Name}}` を置き換える / 入れ子 / 3回を超える・見つからない参照は解けない | 2.5.4 |
| `output` | 同じ入力で同じ文字列（キーの順・インデント・末尾の改行）/ 日本語がそのまま / `spells` が4つで解けないものは `null` | 3.2, 3.4 |
| 入口 | fixtures のフォルダで最後まで動き、ファイルと集計の表示（割合・解けなかった名前の上位）が出る（取得はモック） | 3.1, 3.3 |

### 画面（jest・Testing Library）

| 対象 | 確かめること | 要件 |
|---|---|---|
| `calcStatAtLevel`・`calcAttackSpeedAtLevel` | アーゴット: 体力 Lv.18 `2389`・攻撃速度 Lv.18 `1.023`・物理防御 `121`・魔法防御 `66.9` / Lv.1 は基礎のまま | 6.4 |
| `toStatRows` | 行の順と名前 / リソースの名前が `partype` / `なし` は行なし / 移動速度・射程は成長・Lv.18 なし | 6.4 |
| `toRoleLabel`・`formatStat` | 6つの役割 / 知らない値はそのまま / 小数の書き方 | 6.2, 6.4 |
| `toChampionSkills`（結果のファイルあり） | `detail` が入る / `null` のスキルは `detail` が `null` / ファイルが無いときは全部 `null` | 2.1, 4.2 |
| `fetchSkillValues` | URL（ウーコンは `MonkeyKing`）/ 404 は `null` | 4.1 |
| `useChampionDetail` | 両方取れる / 結果のファイルだけ失敗しても `skills` が出る | 4.2 |
| `SkillTooltipContent` | `detail` があればそれ、無ければ `description` / 数値が数値の色になる | 1.6, 4.3 |
| `ChampionInfoPanel` | 見出しと開閉（`aria-expanded`、最初は開く、閉じると中身が無い）/ 特性の横棒の値 / 表の値（アーゴット）/ スキルが P・Q・W・E・R の順で、CD・コスト・射程と説明文 / 読み込み前・失敗は表示が壊れない | 6.1, 6.3〜6.6 |
| `ChampionBuildHeader` | 称号と役割の札（ファイター・タンク） | 6.2 |
| 既存のテスト | ビルド画面・試合詳細のテストが通る | 4.3 |

### 手で確かめること

- スクリプトを 16.21.1 で流し、解けたスキルの割合が 80% 以上（要件5.2）。解けなかった上位を見て、多いものから対応する
- アーゴット・アーリ・ジンクス・ヤスオ・リー・シンの数値を wiki と見比べる
- 2回流して `git diff` が出ない
- 画面で基礎情報（開閉・表・スキル）とツールチップの数値を確かめる。狭い画面で表が1列になる
