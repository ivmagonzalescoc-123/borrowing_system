import { useEffect, useState } from 'react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import ReservationSuccessModal from '../components/ReservationSuccessModal';
import { useBookmarks } from '../context/BookmarkContext';
import { useNotifications } from '../context/NotificationContext';

export default function StudentBookmarksPage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reservationResult, setReservationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { bookmarkedIds } = useBookmarks();
  const { addNotification } = useNotifications();

  async function loadBooks() {
    const res = await api.get('/books');
    setBooks(res.data.books);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  const bookmarkedBooks = books.filter((b) => bookmarkedIds.includes(b.id));

  async function handleReserveSubmit(payload) {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/borrows', payload);
      setSelectedBook(null);
      setReservationResult(res.data.record);
      addNotification(`You have successfully reserved "${res.data.record.book_title}".`);
      loadBooks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bookmarks</h1>
          <p className="page-subtitle">Books you've saved for later.</p>
        </div>
      </div>

      <div className="catalog-grid">
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
          <p className="empty-state">You haven't bookmarked any books yet.</p>
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
