---
inclusion: fileMatch
fileMatchPattern: '{frontend,backend}/**/*.{ts,tsx,py}'
---

# コーディング規約（共通）

## 概要

フロントエンド・バックエンド共通のコーディング規約を定義します。

## 命名規則

### フロントエンド（TypeScript）
- **変数・関数**: camelCase（例: `userData`, `fetchData`）
- **コンポーネント**: PascalCase（例: `GlobalLoading`, `UserProfile`）
- **定数**: UPPER_SNAKE_CASE（例: `API_BASE_URL`, `MAX_RETRY`）
- **boolean**: `is`, `has`, `should` で始める（例: `isLoading`, `hasError`）
- **イベントハンドラ**: `handle` で始める（例: `handleClick`, `handleSubmit`）

### バックエンド（Python）
- **関数・変数**: snake_case（例: `user_data`, `fetch_data`）
- **クラス**: PascalCase（例: `UserService`, `NoteModel`）
- **定数**: UPPER_SNAKE_CASE（例: `MAX_RETRY_COUNT`, `API_VERSION`）
- **プライベート**: `_leading_underscore`（例: `_internal_method`）

## インポート順序

### TypeScript
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { NextPage } from 'next';

// 2. 内部ライブラリ（絶対パス）
import { Button } from '@/components/ui/Button';
import { useSummoner } from '@/lib/hooks/useSummoner';

// 3. 相対パス
import './styles.css';
import { validateInput } from '../utils/validation';
```

### Python
```python
# 1. 標準ライブラリ
import os
from datetime import datetime

# 2. サードパーティライブラリ
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 3. ローカルモジュール
from config import settings
from models.note_model import Note
```

## 型定義

### TypeScript
- **必須**: 関数の引数と戻り値に型を明示
- **禁止**: `any` の使用（やむを得ない場合は `unknown`）
- **推奨**: 型推論の活用

```typescript
// Good
function fetchUser(userId: string): Promise<User> {
  // ...
}

// Bad
function fetchUser(userId) {
  // ...
}
```

### Python
- **必須**: すべての関数に型ヒントを追加

```python
# Good
def get_user(user_id: int) -> Optional[dict]:
    pass

# Bad
def get_user(user_id):
    pass
```

## エラーハンドリング

### フロントエンド
```typescript
async function fetchData() {
  try {
    const res = await fetch('/api/endpoint');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}
```

### バックエンド
```python
from fastapi import HTTPException, status

# 404エラー
if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )

# 400エラー
if not is_valid(data):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid data"
    )
```

## 環境変数

### フロントエンド
- **公開変数**: `NEXT_PUBLIC_` プレフィックス必須
- **使用**: `process.env.NEXT_PUBLIC_API_URL`

### バックエンド
- **設定管理**: `config.py` で一元管理
- **使用**: `settings.database_url`

## コメント・ドキュメント

### TypeScript（JSDoc）
```typescript
/**
 * ユーザー情報を取得する
 * @param userId - ユーザーID
 * @returns ユーザー情報
 */
async function fetchUser(userId: string): Promise<User> {
  // ...
}
```

### Python（Google Style）
```python
def fetch_user(user_id: int) -> Optional[dict]:
    """ユーザー情報を取得する
    
    Args:
        user_id: ユーザーID
    
    Returns:
        ユーザー情報の辞書
    
    Raises:
        HTTPException: ユーザーが見つからない場合
    """
    pass
```

## ファイルサイズガイドライン

- **コンポーネント**: 200行以内
- **ユーティリティ**: 100行以内
- **APIエンドポイント**: 300行以内

大きくなった場合は分割を検討する。
