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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
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

  async function handleDeleteBook(book) {
    try {
      await api.delete(`/books/${book.id}`);
      showSuccess('Book deleted successfully');
      loadBooks();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete book');
    }
  }

  return (
    <div className="page catalog-page">
      <div className="page-header">
        <div>
          <h1>Book References Catalog</h1>
          <p className="page-subtitle">Manage the library's book inventory.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
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
            <BookCatalogCard key={book.id} book={book} onOpen={setSelectedBook} onDelete={handleDeleteBook} />
          ))}
          {filteredBooks.length === 0 && <p className="empty-state">No books match your search.</p>}
        </div>
      </div>

      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} readOnly />
      )}

      {showAddModal && (
        <AddBookModal
          submitting={submitting}
          error={formError}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBook}
        />
      )}
    </div>
  );
}
