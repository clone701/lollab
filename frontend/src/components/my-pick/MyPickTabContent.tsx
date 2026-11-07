'use client';

import Toast from '@/components/ui/Toast';
import useToast from '@/lib/hooks/useToast';
import { PickSheetList } from './list';
import { PickSheetView } from './view';
import { PickSheetEditor } from './edit';
import { useMyPickScreen } from './useMyPickScreen';

interface MyPickTabContentProps {
  /** 編集画面に未保存の変更があるかが変わったとき */
  onDirtyChange: (isDirty: boolean) => void;
}

// マイピックタブ。一覧・閲覧・編集を切り替える
export function MyPickTabContent({ onDirtyChange }: MyPickTabContentProps) {
  const { toast, showToast, hideToast } = useToast();
  const nav = useMyPickScreen(showToast);
  const { screen } = nav;

  return (
    <div>
      {screen.mode === 'list' && (
        <PickSheetList
          onOpen={nav.showView}
          onCreated={nav.showEdit}
          onToast={showToast}
        />
      )}
      {screen.mode === 'view' && (
        <PickSheetView
          sheetId={screen.sheetId}
          onBack={nav.showList}
          onEdit={() => nav.showEdit(screen.sheetId)}
          onDeleted={() => {
            nav.showList();
            showToast('マイピック表を削除しました', 'success');
          }}
          onNotFound={nav.handleNotFound}
          onToast={showToast}
        />
      )}
      {screen.mode === 'edit' && (
        <PickSheetEditor
          sheetId={screen.sheetId}
          onSaved={() => {
            nav.showView(screen.sheetId);
            showToast('マイピック表を保存しました', 'success');
          }}
          onCancel={() => nav.showView(screen.sheetId)}
          onNotFound={nav.handleNotFound}
          onDirtyChange={onDirtyChange}
          onToast={showToast}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
