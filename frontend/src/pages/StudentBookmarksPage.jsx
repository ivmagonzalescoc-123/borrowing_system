import { useEffect, useState } from 'react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import ReservationSuccessModal from '../components/ReservationSuccessModal';
import CatalogSkeleton from '../components/CatalogSkeleton';
import { EmptyState, ErrorState } from '../components/DataState';
import { useBookmarks } from '../context/BookmarkContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

export default function StudentBookmarksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reservationResult, setReservationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { bookmarkedIds } = useBookmarks();
  const { addNotification } = useNotifications();
  const { showSuccess, showError } = useToast();

  async function loadBooks() {
    try {
      const res = await api.get('/books');
      setBooks(res.data.books);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  const bookmarkedBooks = books.filter((b) => bookmarkedIds.includes(b.id));

  async function handleReserveSubmit(payload) {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/borrows', payload, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      });
      setSelectedBook(null);
      setReservationResult(res.data.record);
      addNotification(`You have successfully reserved "${res.data.record.book_title}".`);
      showSuccess('Book reserved successfully');
      loadBooks();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reserve book';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bookmarks</h1>
        </div>
      </div>

      <div className="catalog-grid">
        {loading ? (
          <CatalogSkeleton />
        ) : loadError ? (
          <ErrorState onRetry={loadBooks} />
        ) : (
          <>
            {bookmarkedBooks.map((book) => (
              <BookCatalogCard
                key={book.id}
                book={book}
                onOpen={(b) => {
                  setFormError('');
                  setSelectedBook(b);
                }}
              />
            ))}
            {bookmarkedBooks.length === 0 && (
              <EmptyState message="You haven't bookmarked any books yet." />
            )}
          </>
        )}
      </div>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          submitting={submitting}
          error={formError}
          onClose={() => setSelectedBook(null)}
          onSubmitReservation={handleReserveSubmit}
        />
      )}

      {reservationResult && (
        <ReservationSuccessModal record={reservationResult} onClose={() => setReservationResult(null)} />
      )}
    </div>
  );
}
