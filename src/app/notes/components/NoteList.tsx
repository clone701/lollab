export default function NoteList() {
  // 仮データ
  const notes = [
    {
      id: 1,
      title: 'ランクマッチ学習メモ',
      desc: '序盤のジャングル介入が重要',
      tags: ['#ウェーブ', '#ローム'],
      date: '1日前',
      user: { me: 'M', enemy: 'E' },
    },
    {
      id: 2,
      title: 'プロE戦での学び',
      desc: 'レイトゲームでの立ち回りとチームファイト',
      tags: ['#チームファイト', '#ウェーブ'],
      date: '5日前',
      user: { me: 'M', enemy: 'E' },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="text-base font-semibold mb-2">ノート一覧</div>
      {notes.map(note => (
        <div key={note.id} className="bg-white border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold border border-gray-200">{note.user.me}</span>
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold border border-pink-200">{note.user.enemy}</span>
            <span className="ml-2 font-bold">{note.title}</span>
            <span className="ml-auto text-xs text-gray-400">{note.date}</span>
          </div>
          <div className="text-sm text-gray-500">{note.desc}</div>
          <div className="flex gap-2">
            {note.tags.map(tag => (
              <span key={tag} className="bg-blue-100 text-blue-700 text-xs rounded px-2 py-0.5">{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}