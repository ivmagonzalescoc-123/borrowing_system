import { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';
import SearchField from './SearchField';
import SparkleSpinner from './SparkleSpinner';
import { EmptyState, ErrorState } from './DataState';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { coverColor, coverInitial } from '../utils/bookCover';
import { formatDate } from '../utils/dateFormat';

// Archived books: hidden from the catalog but never deleted, so their
// borrowing history stays intact. Staff can bring any of them back.
export default function ArchivedBooksModal({ onClose, onRestored }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const confirm = useConfirm();
  const { showSuccess, showError } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.get('/books/archived');
      setBooks(res.data.books);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRestore(book) {
    const ok = await confirm({
      title: 'Restore this book?',
      message: 'It will appear in the catalog again and students can reserve it.',
      details: [
        ['Book', book.title],
        ['Copies', book.total_copies],
      ],
      confirmLabel: 'Restore',
    });
    if (!ok) return;

    setRestoringId(book.id);
    try {
      await api.patch(`/books/${book.id}/restore`);
      showSuccess(`"${book.title}" is back in the catalog`);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      onRestored?.();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to restore book');
    } finally {
      setRestoringId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const shown = books.filter(
    (b) => !q || [b.title, b.author, b.isbn].filter(Boolean).some((v) => v.toLowerCase().includes(q))
  );

  return (
    <Modal onClose={onClose} className="modal-card-wide" label="Archived books">
      <h4 className="section-title">Archived Books</h4>
      <p className="modal-subtitle">Hidden from the catalog, with all borrowing history kept.</p>

      {books.length > 5 && (
        <div className="archived-search">
          <SearchField value={query} onChange={setQuery} placeholder="Search archived books" />
        </div>
      )}

      <div className="archived-list">
        {loading ? (
          <div className="page-loader is-inline">
            <SparkleSpinner size={22} />
          </div>
        ) : loadError ? (
          <ErrorState onRetry={load} />
        ) : (
          <>
            {shown.map((book) => (
              <div key={book.id} className="archived-row">
                <div className="record-cover" style={book.cover_url ? undefined : { background: coverColor(book.title) }}>
                  {book.cover_url ? <img src={book.cover_url} alt="" /> : <span>{coverInitial(book.title)}</span>}
                </div>
                <div className="compact-main">
                  <strong>{book.title}</strong>
                  <span className="muted">
                    {book.author} · archived {formatDate(book.archived_at)}
                  </span>
                </div>
                <button
                  type="button"
                  className={`btn-ghost btn-sm${restoringId === book.id ? ' is-loading' : ''}`}
                  onClick={() => handleRestore(book)}
                  disabled={restoringId === book.id}
                >
                  {restoringId === book.id ? (
                    <SparkleSpinner size={14} />
                  ) : (
                    <>
                      <ArchiveRestore size={14} strokeWidth={1.75} /> Restore
                    </>
                  )}
                </button>
              </div>
            ))}
            {shown.length === 0 && (
              <EmptyState message={q ? `No archived books match “${query}”.` : 'No archived books.'} />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
