# 設計: game-data-tooltip

要件: `requirements.md`。Issue #128。

## データの置き場所

| 元（`D:\dev\16.21.1`） | 置き場所（`frontend/public/images/`） | 使い方 |
|---|---|---|
| `data/ja_JP/item.json` | `data/ja_JP/item.json` | アイテムの名前・価格・説明 |
| `data/ja_JP/runesReforged.json` | `data/ja_JP/runesReforged.json` | ルーン・パスの名前・説明 |
| `data/ja_JP/summoner.json` | `data/ja_JP/summoner.json` | スペルの名前・CD・説明（`key` が数値の ID） |
| `data/ja_JP/champion/*.json` | `data/ja_JP/champion/*.json` | スキル・パッシブの名前・CD・コスト・説明・画像ファイル名 |
| `img/spell/*` | `img/spell/*` | スキル画像（`spells[i].image.full`） |
| `img/passive/*` | `img/passive/*` | パッシブ画像（`passive.image.full`） |

- ファイルは加工せずにコピーする。パッチの更新は同じ場所への上書きコピー
- チャンピオンのファイル名は `champions.ts` の `id` と同じ。例外は Wukong だけ（ファイルは `MonkeyKing.json`）。`lib/game-data` の `toDdragonChampionKey` で変換する（`RIOT_CHAMPION_NAMES` は Fiddlesticks も含むため使わない）
- ステータスシャード（5001 など）は `runesReforged.json` に無い。ツールチップは今の表示名だけ
- steering `structure.md` に「`public/images/` は `D:\dev\img` と Data Dragon の版のフォルダ構成に合わせる」を追記する

## 全体の流れ

```
アイコンにマウス・フォーカス → Tooltip が開く
  → 内容の部品が hook で JSON を要求（adapters/game-data。初回だけ fetch、以後はキャッシュ）
  → 読み込み中・失敗: 名前（label）だけ / 成功: 名前と説明
```

スキル画像だけは、表示に画像ファイル名が要るため、ビルド画面・試合詳細のビルドタブを開いたときにチャンピオン1体分の JSON を読む。読み込むまでは今の Q/W/E/R の文字を出す（最初の表示を遅らせない）。

## モジュール

### `adapters/game-data/`（JSON の取得）
- `fetchItemData()`・`fetchRuneData()`・`fetchSummonerData()`・`fetchChampionData(key)`: `/images/data/ja_JP/...` を fetch して型付きで返す
- `loadOnce(url)`: URL ごとに Promise を保持し、同じページで2回目以降は同じ Promise を返す。失敗したら保持を消す（次に開いたとき再試行）

### `lib/game-data/`（純粋関数・型）
- `types.ts`: Data Dragon の JSON の型（使う項目だけ）と、画面用の `ItemInfo`・`RuneInfo`・`SpellInfo`・`SkillInfo`
- `toItemInfo(data, id)`・`toRuneInfo(data, id)`・`toSpellInfo(data, id)`: ID から画面用の情報。無ければ `null`
- `toChampionSkills(data)`: パッシブと Q/W/E/R の `SkillInfo`（名前・説明・`cooldownBurn`・`costBurn`・コストの種類（`partype`）・画像パス）
- `formatCooldown`・`formatCost`: `10/9.5/9/8.5/8 秒`、`70 マナ`。`costBurn` が `0` なら `null`
- `toDdragonChampionKey(id)`: `Wukong` → `MonkeyKing`、それ以外はそのまま
- `parseDescription(html)`: 説明文を `DescriptionNode[]` にする（下記）

### `lib/tooltip/`
- `calcTooltipPosition(trigger, panel, viewport)`: アイコンの下に出し、下にはみ出すなら上へ。左右は画面内に収める。`{ top, left, placement }` を返す

### `components/ui/tooltip/`（汎用。ゲームデータを知らない）
- `Tooltip`: `trigger`（アイコン）と `content` を受け取る。開閉は `useTooltip`
- `useTooltip`: 開閉の状態。mouseenter・focus で開く、mouseleave・blur・Esc で閉じる
- `TooltipPanel`: `createPortal` で `body` に出す（`overflow-x-auto` の中でも切れない）。`role="tooltip"`、`id` は `useId`。トリガーに `aria-describedby` を付ける
- トリガーがリンク・ボタンでないときは `tabIndex={0}` の `span` で包む（キーボードで選べるように）

### `components/game-data/`（ゲームデータ固有）
- `ItemTooltipIcon`・`RuneTooltipIcon`・`SpellTooltipIcon`: 今の `BuildIcon` を `Tooltip` で包む。`BuildIcon` の props はそのまま受け取る
- `ItemTooltipContent` などの内容の部品: hook でデータを取り、名前・価格（CD）・説明を出す
- `useItemData`・`useRuneData`・`useSummonerData`: 開いたときだけ読み込む（`enabled` 引数）
- `useChampionSkills(championId)`: ビルド画面・試合詳細で使う。`SkillInfo[]` か `null`
- `SkillIcon`: スキル画像に Q/W/E/R を右下に重ねる。画像が無い・読み込み前は文字だけ。ツールチップ付き
- `DescriptionText`: `DescriptionNode[]` を React の要素にする

### `BuildIcon` の変更
- `showTitle?: boolean`（既定 `true`）を追加。ツールチップを付けるときは `false` にして、ブラウザの `title` と二重に出ないようにする

## 説明文の変換（`parseDescription`）

`dangerouslySetInnerHTML` は使わない。タグを正規表現で切り出し、次の表のノードにする。

| タグ | ノード | 表示 |
|---|---|---|
| `br` | 改行 | 改行 |
| `stats` | ステータスのまとまり | `text-fg-muted` |
| `attention` | 強調（数値） | `font-semibold text-fg` |
| `active`・`passive`・`keywordMajor` | 効果の見出し | `font-semibold text-highlight` |
| `rules`・`flavorText` | 補足 | `italic text-fg-subtle` |
| `physicalDamage`・`scaleAD` | 物理 | `text-game-physical` |
| `magicDamage`・`scaleAP` | 魔法 | `text-game-magic` |
| `trueDamage` | 確定 | `font-semibold text-fg` |
| `healing`・`scaleHealth`・`lifeSteal` | 回復・体力 | `text-game-heal` |
| `shield` | シールド | `text-game-shield` |
| `status` | 状態異常 | `text-game-status` |
| `scaleMana` | マナ | `text-game-mana` |
| `keyword`・`keywordName`・`keywordStealth`・`spellName` | 用語 | `font-semibold` |
| `gold` | ゴールド | `text-highlight` |
| `b` | 太字 | `font-semibold` |
| `lol-uikit-tooltipped-keyword` | 用語（ルーンの「アダプティブフォース」など） | `text-game-keyword` |
| `font color='#…'` | 色の系統で役割に置き換える（下記）。指定の色そのものは使わない | 役割の色 |
| 上以外（`mainText` など） | タグを外して中の文字だけ | 本文 |

- `font` の色の置き換え（`toFontColorType`）: 黄（`#FFF673` など）→ 数値、青緑（`#48C4B7`・`#91D7EE`）→ 用語、橙（`#FF9900`）→ 物理、緑（`#00DD33`・`#669900`・`#1CA935`）→ 回復、青（`#38A8E8`）→ シールド、桃・紫（`#EE91D7`・`#9B0F5F`）→ 状態異常、赤（`#FE5C50`・`#DD2E2E`）→ 物理。色相で分け、当てはまらなければタグを外すだけ
- 語の色付け（`highlightTerms`）: スキルの `description`（概要）はタグがほとんど無いため、色の付いたノードの外の文字にある決まった語を、その役割のノードにする。語は ja_JP の `tooltip` で各タグに入っている語から決めた
  - 状態異常（`status`）: スロウ・スタン・ノックアップ・ノックバック・スネア・フィアー・移動不能・サプレッション・行動妨害・サイレンス・チャーム・釘付け・バーサーク・タウント・眠り・打ち上げ・引き寄せ・重傷（後ろの「効果」「状態」も含める）
  - 物理・魔法・確定ダメージ（`physical`・`magic`・`trueDamage`）、シールド（`shield`）、回復（`heal`。「体力を回復」「回復」）
- 数値の強調: 色の付いたノードの外の文字にある数値（`1.8 - 4`・`8%`・`20秒`・`70 - 240` のような範囲・単位を含む）を数値のノードにし、`font-semibold text-game-number` にする。色の付いたノードの中の数値は `font-semibold` だけ（色はそのノードのまま）

色は `globals.css` の `@theme` に `game-*` の役割として足す（下の「ツールチップの見た目」）。

- 文字は React の文字列として出す（エスケープは React に任せる）
- 閉じていないタグ・壊れたタグは無視して文字だけ残す
- `&nbsp;` などの文字参照は、使われているもの（`&nbsp;`・`&amp;`・`&lt;`・`&gt;`）だけ戻す

## ツールチップの見た目

- パネル: `bg-surface border border-line-strong rounded-lg shadow-md p-3 text-sm max-w-xs`、文字は `text-fg`
- 見出し: 左にアイコン（40px）、その右に名前（`text-base font-semibold`）。右上に価格・CD（`font-semibold`）、その下にコスト（`text-xs text-fg-muted`）。スキルは名前の頭に `[Q]`
- 説明は見出しの下に、枠線（`border-t border-line`）で区切って出す。行の間は `leading-relaxed`
- 説明文の色（`@theme` に追加。`bg-surface` の上で WCAG AA 4.5:1 以上）

| 役割 | 値 | コントラスト比 |
|---|---|---|
| `game-physical` | `#fb923c` | 7.7 |
| `game-magic` | `#818cf8` | 5.8 |
| `game-heal` | `#4ade80` | 10.0 |
| `game-shield` | `#7dd3fc` | 10.4 |
| `game-status` | `#c084fc` | 6.6 |
| `game-mana` | `#93c5fd` | 9.6 |
| `game-keyword` | `#48c4b7` | 8.2 |
| `game-number` | `#fde68a` | 14.0 |

- 名前（見出し）は `text-highlight`（ゲーム内の表示に合わせて金色）
- 開くまでの遅れは 100ms（マウスが通り過ぎただけで出ないように）。フォーカスでは即時

## 変更する画面

| 部品 | 変更 |
|---|---|
| `champion-build/ItemIcons`・`match-detail/build/ItemGroup`・`overview/cells/ItemsCell`・`match-card/MatchItems` | `BuildIcon` → `ItemTooltipIcon` |
| `champion-build/RuneGroup`・`match-detail/build/RuneCell`・`overview/cells/SpellRuneCell`・`match-card/MatchSpellRune` | ルーン・スペルを `RuneTooltipIcon`・`SpellTooltipIcon` に |
| `champion-build/SpellPanel` | `SpellTooltipIcon` に |
| `champion-build/SkillPanel`・`SkillOrderGrid` | `championId` を受け取り、行の見出しと優先順を `SkillIcon` に。スキル欄の頭にパッシブの `SkillIcon` |
| `match-detail/build/SkillOrderView`・`SkillLevelList` | `championName` を受け取り、マスを `SkillIcon` に（R の強調は残す） |
| `ChampionBuildBody`・`BuildDetails` | `championId`・`championName` を渡す |
| `notes/NoteForm/NoteFormFields` の `SpellItemView` | スペル・初期アイテムの `img` を `Tooltip` で包む（閲覧モードだけの表示） |
| `notes/RuneSelector/RuneButton` | `tooltip?: boolean` を追加。`true` のとき `Tooltip` で包み、無効のボタンに `pointer-events-none` を付ける（無効のボタンはマウスのイベントを出さないため、包んだ `span` で受ける）。`RuneSelector` に閲覧モード（`disabled`）のときだけ `true` を渡す |

- 対策ノートのスペルは `'SummonerFlash'` のような文字の ID で保存している。`toSpellInfo` は数値の `key` に加えて、`summoner.json` の `data` のキー（`SummonerFlash`）でも引けるようにする
- 初期アイテムの ID は文字列（`'1055'`）。`toItemInfo` はそのまま使える

## 決めたこと

- ツールチップは自作する（`@floating-ui/react` などは入れない）。必要なのは位置の計算と開閉だけで、小さい関数に分けられるため
- JSON は加工せずに置く（パッチ更新を上書きコピーだけにするため）。`item.json` は 766KB だが、CloudFront の圧縮で 117KB になり、初めて開いたときに1回だけ読む
- 汎用の `Tooltip` は `components/ui/` に置き、ゲームデータの部品から使う（依存は一方向）

## テスト仕様

テストデータは本物の JSON を読まず、`__fixtures__` に必要な項目だけの小さい JSON を置く（アーゴット、ウーコン（`MonkeyKing`）、ゾーニャの砂時計 3157、フラッシュ 4、征服者 8010）。

### 純粋関数（`lib/`）

| 対象 | 確かめること | 要件 |
|---|---|---|
| `parseDescription` | `<br>` が改行になる / `stats`・`attention`・`active`・`rules` が決めたノードになる / 知らないタグ（`physicalDamage`・`font color=…`・`lol-uikit-…`）は外れて文字が残る / 入れ子のタグ / 閉じていない・壊れたタグでも文字が残り例外にならない / `&nbsp;` などが戻る / `<script>` は外れて中身も文字として残るだけ | 2.2, 7.1 |
| `parseDescription`（性質） | どんな文字列でも例外にならない / `&` を含まない文字列では、出てきた文字をつなぐと、元の文字列からタグ（`<英字…>`・`</英字…>`）を除いたものに等しい（fast-check） | 7.1 |
| `toItemInfo` | 名前・合計価格・説明 / 無い ID は `null` | 2.1, 2.3 |
| `toRuneInfo` | ルーンは名前と `longDesc` / パスは名前だけ / ステータスシャード・無い ID は `null` | 3.1, 3.2 |
| `toSpellInfo` | 数値の ID（`key`）で引ける / 名前・CD・説明 / 無い ID は `null` | 4.1 |
| `toChampionSkills` | パッシブと Q/W/E/R の順 / 画像パスが `/images/img/spell/UrgotQ.png`・`/images/img/passive/Urgot_Passive.png` | 5.1, 5.5 |
| `formatCooldown`・`formatCost` | `10/9.5/9/8.5/8 秒`・`70 マナ` / `costBurn` が `0` なら `null` | 5.3, 5.4 |
| `toDdragonChampionKey` | `Wukong` → `MonkeyKing`、`Fiddlesticks` → `Fiddlesticks`、`Urgot` → `Urgot` | 5.1 |
| `calcTooltipPosition` | 下に出す / 下にはみ出すと上 / 右端・左端で画面内に収まる / パネルが画面より大きくても `left` が 0 未満にならない | 1.3 |

### 取得（`adapters/game-data/`）

| 対象 | 確かめること | 要件 |
|---|---|---|
| `loadOnce` | 同じ URL を2回呼んでも fetch は1回 / 失敗したら次の呼び出しで再び fetch する | 1.6 |
| `fetchChampionData` | `/images/data/ja_JP/champion/MonkeyKing.json` を取る（ウーコン） | 5.1 |

### 部品（Testing Library）

| 対象 | 確かめること | 要件 |
|---|---|---|
| `Tooltip` | マウスを乗せて 100ms 後に開く / 100ms 前に離れると開かない / フォーカスで即時に開く / マウスが離れる・フォーカスが外れる・Esc で閉じる / 開いたとき `role="tooltip"` があり、トリガーの `aria-describedby` がその `id` を指す / リンクでない中身は `tabIndex=0` で包まれる | 1.1, 1.2, 1.4 |
| `ItemTooltipIcon` | 開くとアイテム名・`3,250` ゴールド・説明（`時間停止` が見出し）が出る / 読み込み中・取得失敗は名前（label）だけで、画面は壊れない / 無い ID は「情報がありません」 / 開くまで fetch しない / `img` に `title` が付かない | 1.5, 1.6, 2.1〜2.3 |
| `RuneTooltipIcon`・`SpellTooltipIcon` | ルーン名と説明、スペル名と CD と説明が出る | 3.1, 4.1 |
| `SkillIcon` | 画像と右下の `Q` / 画像が読み込めない・データが無いときは文字の `Q` だけ / ツールチップに `[Q]`・名前・CD・コスト・説明 / コストが無いスキルはコストの行が無い | 5.1〜5.4 |
| `SkillPanel`・`SkillOrderGrid` | データの読み込み前は今の文字の表示 / 読み込み後は行の見出しがスキル画像 / パッシブのアイコンが出る | 5.1, 5.2, 5.5, 8.3 |
| `SkillLevelList` | マスがスキル画像になり、R の強調は残る / ウーコンでも画像が出る | 5.1 |
| 既存の画面のテスト | ビルド画面・試合詳細・試合カードの既存テストが通る（`title` を前提にしたものは直す） | 6 |

### 手で確かめること（本番デプロイ後）

- ビルド画面・試合詳細・試合カードで、アイテム・ルーン・スペル・スキルのツールチップが出て、画面の端で切れない
- DevTools の Network で、`item.json` が圧縮後 150KB 以下（`content-encoding` が付いている）で、同じページで2回目は読まれない
- スキル表の横スクロールの中でもツールチップが切れない
