import { useEffect, useMemo, useState } from 'react';
import { Archive, Plus } from 'lucide-react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import AddBookModal from '../components/AddBookModal';
import BookSearchBar from '../components/BookSearchBar';
import CatalogSkeleton from '../components/CatalogSkeleton';
import ArchivedBooksModal from '../components/ArchivedBooksModal';
import { EmptyState, ErrorState } from '../components/DataState';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { PAGE_SIZE, categoriesOf, filterBooks, sortBooks } from '../utils/catalog';
import PageHelp from '../components/PageHelp';

export default function StaffCatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [archivingId, setArchivingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState('title');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

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

  const categories = useMemo(() => categoriesOf(books), [books]);
  const filteredBooks = useMemo(
    () => sortBooks(filterBooks(books, { query, category }), sort),
    [books, query, category, sort]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category, sort]);

  function bookDetails(payload) {
    return [
      ['Title', payload.title],
      ['Author', payload.author],
      ['Copies', payload.totalCopies],
    ];
  }

  async function handleAddBook(payload) {
    const ok = await confirm({
      title: 'Add this book to the catalog?',
      message: 'Students will be able to see and reserve it right away.',
      details: bookDetails(payload),
      confirmLabel: 'Add book',
    });
    if (!ok) return;
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/books', payload);
      setShowAddModal(false);
      showSuccess('Book added successfully');
      loadBooks();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add book';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateBook(payload) {
    const ok = await confirm({
      title: 'Save changes to this book?',
      details: bookDetails(payload),
      confirmLabel: 'Save changes',
    });
    if (!ok) return;
    setSubmitting(true);
    setFormError('');
    try {
      await api.put(`/books/${editingBook.id}`, payload);
      setEditingBook(null);
      showSuccess('Book updated successfully');
      loadBooks();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update book';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditBook(book) {
    setFormError('');
    setSelectedBook(null);
    setEditingBook(book);
  }

  // Books are never deleted — archiving hides one from the catalog and keeps
  // its history; it can be restored from "Archived".
  async function handleArchiveBook(book) {
    const copiesOut = Number(book.reserved_count) + Number(book.borrowed_count);
    if (copiesOut > 0) {
      await confirm({
        title: "Can't archive this book yet",
        message: `${copiesOut} ${copiesOut === 1 ? 'copy is' : 'copies are'} still reserved or on loan. Resolve ${
          copiesOut === 1 ? 'it' : 'them'
        } first, then archive the book.`,
        confirmLabel: 'OK',
        cancelLabel: 'Close',
        tone: 'warning',
      });
      return;
    }

    const ok = await confirm({
      title: 'Move this book to the archive?',
      message: 'It will be hidden from the catalog. Its borrowing history is kept, and you can restore it anytime from Archived.',
      details: [
        ['Book', book.title],
        ['Author', book.author],
      ],
      confirmLabel: 'Archive book',
      tone: 'warning',
    });
    if (!ok) return;

    setArchivingId(book.id);
    try {
      await api.patch(`/books/${book.id}/archive`);
      showSuccess(`"${book.title}" moved to the archive`);
      setSelectedBook(null);
      loadBooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to archive book', 4000);
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="page catalog-page">
      <div className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Book References Catalog</h1>
            <PageHelp>
              <ul>
                <li><strong>Add Book</strong> to put a new title in the catalog.</li>
                <li>Tap a book to see its details, then <strong>Edit Book</strong> to change it.</li>
                <li>
                  The archive icon hides a book from the catalog. Nothing is ever deleted: its history is kept, and
                  you can bring it back from <strong>Archived</strong>.
                </li>
              </ul>
            </PageHelp>
          </div>
          <p className="page-subtitle">
            {books.length} titles · {books.reduce((n, b) => n + b.total_copies, 0)} copies
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-header-ghost" onClick={() => setShowArchived(true)}>
            <Archive size={16} strokeWidth={1.75} />
            Archived
          </button>
          <button type="button" className="btn-primary btn-yellow" onClick={() => setShowAddModal(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Add Book
          </button>
        </div>
      </div>

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
                <BookCatalogCard
                  key={book.id}
                  book={book}
                  onOpen={setSelectedBook}
                  onArchive={handleArchiveBook}
                  archiving={archivingId === book.id}
                  showCopiesOut
                />
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

      {showArchived && <ArchivedBooksModal onClose={() => setShowArchived(false)} onRestored={loadBooks} />}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={handleEditBook}
          onArchive={handleArchiveBook}
          readOnly
        />
      )}

      {showAddModal && (
        <AddBookModal
          submitting={submitting}
          error={formError}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBook}
        />
      )}

      {editingBook && (
        <AddBookModal
          book={editingBook}
          submitting={submitting}
          error={formError}
          onClose={() => setEditingBook(null)}
          onSubmit={handleUpdateBook}
        />
      )}
    </div>
  );
}
