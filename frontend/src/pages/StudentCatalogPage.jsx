import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import ReservationSuccessModal from '../components/ReservationSuccessModal';
import BookSearchBar from '../components/BookSearchBar';
import CatalogSkeleton from '../components/CatalogSkeleton';
import { EmptyState, ErrorState } from '../components/DataState';
import useMyBorrows from '../hooks/useMyBorrows';
import useReserveFlow from '../hooks/useReserveFlow';
import { PAGE_SIZE, categoriesOf, filterBooks, sortBooks } from '../utils/catalog';

export default function StudentCatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('title');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchParams, setSearchParams] = useSearchParams();
  const mine = useMyBorrows();

  const loadBooks = useCallback(async () => {
    try {
      const res = await api.get('/books');
      setBooks(res.data.books);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const reserve = useReserveFlow({
    onChanged: () => {
      loadBooks();
      mine.reload();
    },
  });

  // Deep link from a "book is available again" notification: /student/catalog?book=12
  const bookParam = searchParams.get('book');
  const { openBook } = reserve;
  useEffect(() => {
    if (!bookParam || books.length === 0) return;
    const book = books.find((b) => String(b.id) === bookParam);
    if (book) openBook(book);
    setSearchParams({}, { replace: true });
  }, [bookParam, books, openBook, setSearchParams]);

  const categories = useMemo(() => categoriesOf(books), [books]);
  const filteredBooks = useMemo(
    () => sortBooks(filterBooks(books, { query, category }), sort),
    [books, query, category, sort]
  );

  // Start from the first page again whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category, sort]);

  const selectedBook = reserve.selectedBook && (books.find((b) => b.id === reserve.selectedBook.id) || reserve.selectedBook);

  return (
    <div className="page catalog-page">
      <div className="page-header">
        <div>
          <h1>Book References Catalog</h1>
          <p className="page-subtitle">Find a reference book, reserve it, and pick it up at the library desk.</p>
        </div>
      </div>

      {/* Status cards live on the Dashboard; only the overdue warning stays
          here, since it's why the Reserve button is disabled. */}
      {mine.summary.overdue.length > 0 && (
        <Link to="/student/borrowed" className="alert-banner is-danger catalog-alert">
          <AlertCircle size={18} strokeWidth={1.75} />
          <span>
            <strong>Overdue book.</strong> Return it to the library desk to reserve again.
          </span>
        </Link>
      )}

      <BookSearchBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="catalog-scroll-area">
        <div className="catalog-grid">
          {loading ? (
            <CatalogSkeleton />
          ) : loadError ? (
            <ErrorState onRetry={loadBooks} />
          ) : (
            <>
              {filteredBooks.slice(0, visibleCount).map((book) => (
                <BookCatalogCard key={book.id} book={book} onOpen={reserve.openBook} />
              ))}
              {filteredBooks.length === 0 && <EmptyState message="No books match your search." />}
            </>
          )}
        </div>
        {!loading && filteredBooks.length > visibleCount && (
          <div className="load-more-row">
            <span className="muted">
              Showing {visibleCount} of {filteredBooks.length}
            </span>
            <button type="button" className="btn-ghost" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
              Show more
            </button>
          </div>
        )}
      </div>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          policy={mine.policy}
          blocker={mine.blockerFor(selectedBook)}
          submitting={reserve.submitting}
          error={reserve.formError}
          onClose={reserve.closeBook}
          onSubmitReservation={reserve.submitReservation}
          onToggleWaitlist={reserve.toggleWaitlist}
          waitlistBusy={reserve.waitlistBusy}
        />
      )}

      {reserve.reservationResult && (
        <ReservationSuccessModal record={reserve.reservationResult} onClose={reserve.closeResult} />
      )}
    </div>
  );
}
