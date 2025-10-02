export default function NoteEmpty() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px] border border-[var(--border)] bg-white rounded-xl">
      <span className="text-gray-400 text-lg text-center">
        ノートを選択してください。<br />
        左の一覧からノートを選択するか、新規ノート作成タブで新しいノートを作成してください。
      </span>
    </div>
  );
}