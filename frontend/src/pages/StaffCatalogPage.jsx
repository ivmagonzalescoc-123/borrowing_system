import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import BookCatalogCard from '../components/BookCatalogCard';
import BookDetailModal from '../components/BookDetailModal';
import AddBookModal from '../components/AddBookModal';
import BookSearchBar from '../components/BookSearchBar';
import { useToast } from '../context/ToastContext';

export default function StaffCatalogPage() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
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
      await api.delete(`/books/${book.id}`);
      showSuccess('Book deleted successfully');
      loadBooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete book');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page catalog-page">
      <div className="page-header">
        <div>
          <h1>Book References Catalog</h1>
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
      />

      <div className="catalog-scroll-area">
        <div className="catalog-grid">
          {filteredBooks.map((book) => (
            <BookCatalogCard
              key={book.id}
              book={book}
              onOpen={setSelectedBook}
              onDelete={handleDeleteBook}
              deleting={deletingId === book.id}
            />
          ))}
          {filteredBooks.length === 0 && <p className="empty-state">No books match your search.</p>}
        </div>
      </div>

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
