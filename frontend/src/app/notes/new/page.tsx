import NotesTabBar from '../components/NotesTabBar';
import NewNoteForm from '../components/NewNoteForm';

export default function NotesNewPage() {
  return (
    <div className="py-10">
      <NotesTabBar />
      <NewNoteForm />
    </div>
  );
}