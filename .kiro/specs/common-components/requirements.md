# 要件定義書

## はじめに

このドキュメントは、LoL Labアプリケーションの共通コンポーネントの要件を定義します。この機能は、アプリケーション全体で再利用される基本的なUIコンポーネントとユーティリティを提供します。

## 用語集

- **Panel**: 汎用パネルコンテナコンポーネント
- **アイテムボタン**: ルーン、アイテム、スペルなどを選択するためのボタン
- **スタイル定数**: 再利用可能なTailwind CSSクラス文字列
- **ユーティリティ関数**: スタイルクラスを動的に生成する補助関数
- **アクティブ状態**: ボタンが選択されている状態
- **非アクティブ状態**: ボタンが選択されていない状態
- **無効状態**: ボタンが操作不可能な状態

## 要件

### 要件1: Panelコンポーネント

**ユーザーストーリー:** 開発者として、一貫したスタイルのパネルコンテナを使用したい。そうすることで、アプリケーション全体で統一感のあるUIを実現できる。

#### 受け入れ基準

1. THE Panel_Component SHALL レンダリング時に子要素を表示すること
2. THE Panel_Component SHALL デフォルトで白背景、4pxの角丸、16pxのパディングを適用すること
3. THE Panel_Component SHALL 透明なボーダーをデフォルトで持つこと
4. THE Panel_Component SHALL className プロップを受け取り、追加のスタイルを適用できること
5. THE Panel_Component SHALL children プロップを受け取り、任意のReact要素を内包できること

### 要件2: アイテムボタンスタイル定数

**ユーザーストーリー:** 開発者として、アイテム選択ボタンの一貫したスタイルを定義したい。そうすることで、ルーン、アイテム、スペル選択UIで同じデザインパターンを使用できる。

#### 受け入れ基準

1. THE System SHALL アイテムボタン用の基本スタイル定数（ITEM_BTN_BASE）を提供すること
2. THE System SHALL アクティブ状態のスタイル定数（ITEM_BTN_ACTIVE）を提供すること
3. ITEM_BTN_ACTIVE は、ピンク系カラーを使用し、視覚的に選択状態が明確であること
4. THE System SHALL 非アクティブ状態のスタイル定数（ITEM_BTN_INACTIVE）を提供すること
5. ITEM_BTN_INACTIVE は、グレー系カラーを使用し、ホバー時にインタラクティブであることを示すこと
6. THE System SHALL 無効状態のスタイル定数（ITEM_BTN_DISABLED）を提供すること
7. ITEM_BTN_DISABLED は、視覚的に操作不可能であることが明確であること

### 要件3: itemBtnClass ユーティリティ関数

**ユーザーストーリー:** 開発者として、ボタンの状態に応じて適切なスタイルクラスを動的に生成したい。そうすることで、アクティブ、非アクティブ、無効状態を簡単に切り替えられる。

#### 受け入れ基準

1. THE itemBtnClass_Function SHALL options オブジェクトを引数として受け取ること
2. WHEN active オプションが true の場合、THE itemBtnClass_Function SHALL ITEM_BTN_ACTIVE スタイルを含む文字列を返すこと
3. WHEN active オプションが false または未指定の場合、THE itemBtnClass_Function SHALL ITEM_BTN_INACTIVE スタイルを含む文字列を返すこと
4. WHEN disabled オプションが true の場合、THE itemBtnClass_Function SHALL ITEM_BTN_DISABLED スタイルを含む文字列を返すこと
5. WHEN extra オプションが指定された場合、THE itemBtnClass_Function SHALL 追加のクラス文字列を結果に含めること
6. THE itemBtnClass_Function SHALL 常に ITEM_BTN_BASE スタイルを含む文字列を返すこと
7. THE itemBtnClass_Function SHALL 余分な空白を削除した文字列を返すこと

### 要件4: 入力フィールドスタイル定数

**ユーザーストーリー:** 開発者として、一貫したスタイルの入力フィールドを使用したい。そうすることで、フォーム全体で統一感のあるUIを実現できる。

#### 受け入れ基準

1. THE System SHALL 入力フィールド用のスタイル定数（BORDER_STYLE_1）を提供すること
2. BORDER_STYLE_1 は、適切なパディング、マージン、ボーダー、角丸を含むこと
3. BORDER_STYLE_1 は、input要素とtextarea要素の両方で使用可能であること
4. 入力フィールドは、フォーカス時に視覚的なフィードバックを提供すること

### 要件5: TypeScript型定義

**ユーザーストーリー:** 開発者として、型安全なコンポーネントとユーティリティを使用したい。そうすることで、コンパイル時にエラーを検出できる。

#### 受け入れ基準

1. THE Panel_Component SHALL children プロップの型を React.ReactNode として定義すること
2. THE Panel_Component SHALL className プロップの型を string として定義し、オプショナルとすること
3. THE itemBtnClass_Function SHALL options 引数の型を定義すること
4. options 型は、active、disabled、extra プロパティを含み、全てオプショナルであること
5. active と disabled は boolean 型、extra は string 型であること

### 要件6: エクスポート

**ユーザーストーリー:** 開発者として、共通コンポーネントとユーティリティを他のファイルから簡単にインポートしたい。そうすることで、アプリケーション全体で再利用できる。

#### 受け入れ基準

1. THE System SHALL Panel コンポーネントをデフォルトエクスポートすること
2. THE System SHALL ITEM_BTN_BASE、ITEM_BTN_ACTIVE、ITEM_BTN_INACTIVE、ITEM_BTN_DISABLED 定数を名前付きエクスポートすること
3. THE System SHALL itemBtnClass 関数を名前付きエクスポートすること
4. THE System SHALL BORDER_STYLE_1 定数を名前付きエクスポートすること

### 要件7: ファイル配置

**ユーザーストーリー:** 開発者として、共通コンポーネントが適切なディレクトリに配置されていることを期待する。そうすることで、プロジェクト構造の一貫性が保たれる。

#### 受け入れ基準

1. THE Panel_Component SHALL frontend/src/components/ui/Panel.tsx に配置されること
2. THE Panel.tsx_File SHALL Panel コンポーネント、スタイル定数、ユーティリティ関数を全て含むこと
3. THE Panel.tsx_File SHALL TypeScript で記述されること
4. THE Panel.tsx_File SHALL React 19 の構文を使用すること

### 要件8: デザインシステムとの整合性

**ユーザーストーリー:** 開発者として、共通コンポーネントがアプリケーションのデザインシステムに準拠していることを期待する。そうすることで、視覚的な一貫性が保たれる。

#### 受け入れ基準

1. THE Panel_Component SHALL アプリケーションのデザインシステムに準拠した配色を使用すること
2. THE Panel_Component SHALL 一貫した角丸とパディングを使用すること
3. アイテムボタンは、アクティブ/非アクティブ/無効状態が視覚的に明確に区別できること
4. アイテムボタンのアクティブ状態は、アプリケーションのプライマリカラー（ピンク系）を使用すること
5. 全てのインタラクティブ要素は、スムーズなトランジションを持つこと

### 要件9: アクセシビリティ

**ユーザーストーリー:** アクセシビリティニーズを持つユーザーとして、共通コンポーネントが使いやすいことを望む。そうすることで、全てのユーザーがアプリケーションを利用できる。

#### 受け入れ基準

1. アイテムボタンの無効状態は、視覚的に識別可能であること
2. アイテムボタンの無効状態は、カーソルが無効化されていること
3. アクティブ状態のボタンは、視覚的に明確に区別できること
4. カラーコントラストは、WCAG 2.1 AA基準を満たすこと

### 要件10: 再利用性

**ユーザーストーリー:** 開発者として、共通コンポーネントが様々なコンテキストで再利用可能であることを期待する。そうすることで、コードの重複を避けられる。

#### 受け入れ基準

1. THE Panel_Component SHALL 任意の子要素を受け入れること
2. THE Panel_Component SHALL className プロップで追加スタイルを受け入れること
3. THE itemBtnClass_Function SHALL 任意の状態の組み合わせをサポートすること
4. THE itemBtnClass_Function SHALL extra プロップで追加クラスを受け入れること
5. スタイル定数は、他のコンポーネントで直接使用可能であること
