import NotesTabBar from '../components/NotesTabBar';
import NoteList from '../components/NoteList';
import NoteEmpty from '../components/NoteEmpty';

export default function NotesPage() {
  return (
    <div className="py-10">
      <NotesTabBar />
      <section className="grid gap-8 md:grid-cols-[1fr,520px]">
        <NoteList />
        <NoteEmpty />
      </section>
    </div>
  );
}