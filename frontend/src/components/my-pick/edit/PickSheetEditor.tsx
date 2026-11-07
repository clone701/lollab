'use client';

import { PickSheetLoader } from '../PickSheetLoader';
import type { ShowToast } from '../types';
import { PickSheetEditorBody } from './PickSheetEditorBody';

interface PickSheetEditorProps {
  sheetId: number;
  onSaved: () => void;
  onCancel: () => void;
  onNotFound: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onToast: ShowToast;
}

// 表の編集。取得して、読み込み中・失敗の表示は PickSheetLoader に任せる
export function PickSheetEditor({
  sheetId,
  onNotFound,
  ...rest
}: PickSheetEditorProps) {
  return (
    <PickSheetLoader sheetId={sheetId} onNotFound={onNotFound}>
      {(sheet) => <PickSheetEditorBody sheet={sheet} {...rest} />}
    </PickSheetLoader>
  );
}
