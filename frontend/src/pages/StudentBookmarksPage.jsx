import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import ReservationSuccessModal from '../components/ReservationSuccessModal';
import CatalogSkeleton from '../components/CatalogSkeleton';
import { EmptyState, ErrorState } from '../components/DataState';
import { useBookmarks } from '../context/BookmarkContext';
import useMyBorrows from '../hooks/useMyBorrows';
import useReserveFlow from '../hooks/useReserveFlow';
import PageHelp from '../components/PageHelp';

export default function StudentBookmarksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { bookmarkedIds } = useBookmarks();
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

  // Most recently bookmarked first.
  const bookmarkedBooks = bookmarkedIds.map((id) => books.find((b) => b.id === id)).filter(Boolean);
  const selectedBook = reserve.selectedBook && (books.find((b) => b.id === reserve.selectedBook.id) || reserve.selectedBook);

  return (
    <div className="page catalog-page">
      <div className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Bookmarks</h1>
            <PageHelp>
              <p>Books you saved for later.</p>
              <p>
                Tap <strong>Bookmark</strong> on any book in the catalog to add it here. Your bookmarks are saved to
                your account, so they show up on any device.
              </p>
            </PageHelp>
          </div>
        </div>
      </div>

      <div className="catalog-scroll-area">
        <div className="catalog-grid">
          {loading ? (
            <CatalogSkeleton />
          ) : loadError ? (
            <ErrorState onRetry={loadBooks} />
          ) : (
            <>
              {bookmarkedBooks.map((book) => (
                <BookCatalogCard key={book.id} book={book} onOpen={reserve.openBook} />
              ))}
              {bookmarkedBooks.length === 0 && (
                <EmptyState message="No bookmarks yet. Tap “Bookmark” on any book in the catalog to save it here." />
              )}
            </>
          )}
        </div>
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
