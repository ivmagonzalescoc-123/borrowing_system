import { useState } from 'react';
import { X } from 'lucide-react';
import Portal from './Portal';

const emptyBook = {
  title: '',
  author: '',
  isbn: '',
  category: '',
  publisher: '',
  publishedDate: '',
  description: '',
  coverUrl: '',
  totalCopies: 1,
};

export default function AddBookModal({ onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(emptyBook);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, totalCopies: Number(form.totalCopies) });
  }

  return (
    <Portal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.75} />
        </button>
        <h4 className="section-title">Add a Book</h4>

        <form className="reservation-form" onSubmit={handleSubmit}>
          <div className="reservation-form-row">
            <label>
              Title
              <input value={form.title} onChange={update('title')} required />
            </label>
            <label>
              Author
              <input value={form.author} onChange={update('author')} required />
            </label>
          </div>
          <div className="reservation-form-row">
            <label>
              ISBN
              <input value={form.isbn} onChange={update('isbn')} />
            </label>
            <label>
              Category
              <input value={form.category} onChange={update('category')} />
            </label>
          </div>
          <div className="reservation-form-row">
            <label>
              Publisher
              <input value={form.publisher} onChange={update('publisher')} />
            </label>
            <label>
              Date Released
              <input type="date" value={form.publishedDate} onChange={update('publishedDate')} />
            </label>
          </div>
          <label>
            Cover Image URL
            <input
              type="url"
              placeholder="https://covers.openlibrary.org/b/isbn/XXXXXXXXXX-L.jpg"
              value={form.coverUrl}
              onChange={update('coverUrl')}
            />
          </label>
          <label>
            Total Copies
            <input type="number" min="1" value={form.totalCopies} onChange={update('totalCopies')} required />
          </label>
          <label>
            Description
            <textarea rows={3} value={form.description} onChange={update('description')} />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Book'}
          </button>
        </form>
      </div>
    </div>
    </Portal>
  );
}
