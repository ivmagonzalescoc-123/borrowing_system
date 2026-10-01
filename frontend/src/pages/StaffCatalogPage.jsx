import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import AddBookModal from '../components/AddBookModal';
import BookSearchBar from '../components/BookSearchBar';
import CatalogSkeleton from '../components/CatalogSkeleton';
import ConfirmModal from '../components/ConfirmModal';
import { EmptyState, ErrorState } from '../components/DataState';
import { useToast } from '../context/ToastContext';
import { PAGE_SIZE, categoriesOf, filterBooks, sortBooks } from '../utils/catalog';

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
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sort, setSort] = useState('title');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  const categories = useMemo(() => categoriesOf(books), [books]);
  const filteredBooks = useMemo(
    () => sortBooks(filterBooks(books, { query, category }), sort),
    [books, query, category, sort]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category, sort]);

  async function handleAddBook(payload) {
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

  async function handleDeleteBook(book) {
    setDeletingId(book.id);
    try {
      const res = await api.delete(`/books/${book.id}`);
      showSuccess(res.data?.message || 'Book removed');
      setDeleteTarget(null);
      loadBooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete book', 4000);
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page catalog-page">
      <div className="page-header">
        <div>
          <h1>Book References Catalog</h1>
          <p className="page-subtitle">
            {books.length} titles · {books.reduce((n, b) => n + b.total_copies, 0)} copies
          </p>
        </div>
        <button className="btn-primary btn-yellow" onClick={() => setShowAddModal(true)}>
          <Plus size={16} strokeWidth={1.75} />
          Add Book
        </button>
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
                  onDelete={setDeleteTarget}
                  deleting={deletingId === book.id}
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

      {deleteTarget &&
        (Number(deleteTarget.reserved_count) + Number(deleteTarget.borrowed_count) > 0 ? (
          <ConfirmModal
            title="Can't remove this book yet"
            message={`"${deleteTarget.title}" still has copies reserved or on loan. Resolve those first.`}
            confirmLabel="OK"
            cancelLabel="Close"
            onConfirm={() => setDeleteTarget(null)}
            onClose={() => setDeleteTarget(null)}
          />
        ) : (
          <ConfirmModal
            title="Remove this book?"
            message={`"${deleteTarget.title}" will be removed from the catalog. If it has borrowing history, it's archived so past records are kept.`}
            confirmLabel="Remove book"
            danger
            submitting={deletingId === deleteTarget.id}
            onConfirm={() => handleDeleteBook(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
          />
        ))}

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={handleEditBook}
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
