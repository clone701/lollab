'use client';

import { PickSheetLoader } from '../PickSheetLoader';
import type { ShowToast } from '../types';
import { PickSheetViewBody } from './PickSheetViewBody';

interface PickSheetViewProps {
  sheetId: number;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  onNotFound: () => void;
  onToast: ShowToast;
}

// 表の閲覧。取得して、読み込み中・失敗の表示は PickSheetLoader に任せる
export function PickSheetView({
  sheetId,
  onNotFound,
  ...rest
}: PickSheetViewProps) {
  return (
    <PickSheetLoader sheetId={sheetId} onNotFound={onNotFound}>
      {(sheet) => <PickSheetViewBody sheet={sheet} {...rest} />}
    </PickSheetLoader>
  );
}
