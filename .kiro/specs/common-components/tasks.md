# 実装計画: 共通コンポーネント

## 概要

LoL Labアプリケーション全体で再利用される基本的なUIコンポーネントとユーティリティを実装します。`frontend/src/components/ui/Panel.tsx` に、Panelコンポーネント、アイテムボタンスタイル定数、itemBtnClassユーティリティ関数、入力フィールドスタイル定数を含む単一ファイルを作成します。

## タスク

- [x] 1. Panel.tsxファイルの作成とTypeScript型定義
  - `frontend/src/components/ui/Panel.tsx` を作成
  - PanelPropsインターフェースを定義（children: React.ReactNode, className?: string）
  - ItemBtnClassOptionsインターフェースを定義（active?: boolean, disabled?: boolean, extra?: string）
  - _要件: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3_

- [ ] 2. スタイル定数の実装
  - [x] 2.1 アイテムボタンスタイル定数を実装
    - ITEM_BTN_BASE定数を定義（基本スタイル）
    - ITEM_BTN_ACTIVE定数を定義（ピンク系カラー、選択状態）
    - ITEM_BTN_INACTIVE定数を定義（グレー系カラー、ホバー効果）
    - ITEM_BTN_DISABLED定数を定義（無効状態、カーソル無効化）
    - _要件: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 8.3, 8.4, 8.5, 9.1, 9.2_
  
  - [x] 2.2 入力フィールドスタイル定数を実装
    - BORDER_STYLE_1定数を定義（パディング、マージン、ボーダー、角丸、フォーカス効果）
    - _要件: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Panelコンポーネントの実装
  - Panelコンポーネントを実装（白背景、4px角丸、16pxパディング、透明ボーダー）
  - classNameプロップで追加スタイルを適用可能にする
  - childrenプロップで任意のReact要素を内包可能にする
  - _要件: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 10.1, 10.2_

- [x] 4. itemBtnClassユーティリティ関数の実装
  - itemBtnClass関数を実装（optionsオブジェクトを引数として受け取る）
  - activeオプションに応じてITEM_BTN_ACTIVEまたはITEM_BTN_INACTIVEを返す
  - disabledオプションが真の場合、ITEM_BTN_DISABLEDを含める
  - extraオプションが指定された場合、追加クラスを含める
  - 常にITEM_BTN_BASEを含める
  - 余分な空白を削除（trim）
  - _要件: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 10.3, 10.4_

- [x] 5. エクスポートの設定
  - Panelコンポーネントをデフォルトエクスポート
  - ITEM_BTN_BASE、ITEM_BTN_ACTIVE、ITEM_BTN_INACTIVE、ITEM_BTN_DISABLEDを名前付きエクスポート
  - itemBtnClass関数を名前付きエクスポート
  - BORDER_STYLE_1を名前付きエクスポート
  - _要件: 6.1, 6.2, 6.3, 6.4, 10.5_

- [x] 6. 最終確認
  - 全ての型定義が正しいことを確認
  - デザインシステムとの整合性を確認（配色、角丸、パディング）
  - アクセシビリティ要件を確認（視覚的識別、カーソル無効化）
  - 質問があればユーザーに確認

## 注意事項

- React 19の構文を使用すること
- Tailwind CSS 4のクラスを使用すること
- 全てのコメントは日本語で記述すること
- デザインシステムのプライマリカラー（ピンク系）を使用すること
- アクティブ/非アクティブ/無効状態が視覚的に明確に区別できること
