import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import ReservationSuccessModal from '../components/ReservationSuccessModal';
import BookSearchBar from '../components/BookSearchBar';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

export default function StudentCatalogPage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reservationResult, setReservationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const { addNotification } = useNotifications();
  const { showSuccess, showError } = useToast();

  async function loadBooks() {
    const res = await api.get('/books');
    setBooks(res.data.books);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  const categories = useMemo(
    () => [...new Set(books.map((b) => b.category).filter(Boolean))],
    [books]
  );

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn || '').toLowerCase().includes(q);
      const matchesCategory = !category || book.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [books, query, category]);

  async function handleReserveSubmit(payload) {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/borrows', payload);
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
    <div className="page catalog-page">
      <div className="page-header">
        <h1>Book References Catalog</h1>
      </div>

      <BookSearchBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />

      <div className="catalog-scroll-area">
        <div className="catalog-grid">
          {filteredBooks.map((book) => (
            <BookCatalogCard
              key={book.id}
              book={book}
              onOpen={(b) => {
                setFormError('');
                setSelectedBook(b);
              }}
            />
          ))}
          {filteredBooks.length === 0 && <p className="empty-state">No books match your search.</p>}
        </div>
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
