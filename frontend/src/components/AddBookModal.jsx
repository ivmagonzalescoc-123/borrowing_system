import { useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import api from '../api/axios';
import Portal from './Portal';
import SparkleSpinner from './SparkleSpinner';

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

export default function AddBookModal({ onClose, onSubmit, submitting, error, book }) {
  const isEditing = Boolean(book);
  const [form, setForm] = useState(() =>
    book
      ? {
          title: book.title,
          author: book.author,
          isbn: book.isbn || '',
          category: book.category || '',
          publisher: book.publisher || '',
          publishedDate: book.published_date || '',
          description: book.description || '',
          coverUrl: book.cover_url || '',
          totalCopies: book.total_copies,
        }
      : emptyBook
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const data = new FormData();
      data.append('cover', file);
      const res = await api.post('/books/upload-cover', data);
      setForm((prev) => ({ ...prev, coverUrl: res.data.url }));
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
        <h4 className="section-title">{isEditing ? 'Edit Book' : 'Add a Book'}</h4>

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
            Cover Image
            <div className="cover-input-row">
              <input
                type="text"
                placeholder="Paste an image URL… (recommended)"
                value={form.coverUrl}
                onChange={update('coverUrl')}
                disabled={uploading}
              />
              <span className="cover-input-divider">or</span>
              <label className={`btn-ghost cover-upload-button${uploading ? ' is-loading' : ''}`}>
                {uploading ? <SparkleSpinner size={14} /> : <ImagePlus size={14} strokeWidth={1.75} />}
                {uploading ? 'Uploading…' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  hidden
                />
              </label>
            </div>
            <p className="field-hint">
              Our database's free tier caps stored files at 10MB, so uploaded photos may fail once space runs low. Using an Image URL is recommended.
            </p>
            {uploadError && <p className="field-error">{uploadError}</p>}
            {form.coverUrl && (
              <div className="cover-preview">
                <img src={form.coverUrl} alt="Cover preview" />
              </div>
            )}
          </label>
          <label>
            Total Copies
            <input type="number" min="1" value={form.totalCopies} onChange={update('totalCopies')} required />
          </label>
          {isEditing && (
            <p className="field-hint">
              Raising or lowering this adjusts available copies by the same amount.
            </p>
          )}
          <label>
            Description
            <textarea rows={3} value={form.description} onChange={update('description')} />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className={`btn-primary${submitting ? ' is-loading' : ''}`} disabled={submitting}>
            {submitting ? (
              <>
                <SparkleSpinner size={16} />
                Saving…
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Save Book'
            )}
          </button>
        </form>
      </div>
    </div>
    </Portal>
  );
}
