import { Trash2 } from 'lucide-react';
import { coverColor, coverInitial } from '../utils/bookCover';
import SparkleSpinner from './SparkleSpinner';

export default function BookCatalogCard({ book, onOpen, onDelete, deleting }) {
  const isAvailable = book.available_copies > 0;

  return (
    <div className="catalog-card" onClick={() => onOpen(book)} role="button" tabIndex={0}>
      {onDelete && (
        <button
          className={`catalog-card-delete${deleting ? ' is-loading' : ''}`}
          aria-label={`Delete ${book.title}`}
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(book);
          }}
        >
          {deleting ? <SparkleSpinner size={14} /> : <Trash2 size={14} strokeWidth={1.75} />}
        </button>
      )}
      <div className="catalog-card-cover" style={book.cover_url ? undefined : { background: coverColor(book.title) }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt="" loading="lazy" />
        ) : (
          <span>{coverInitial(book.title)}</span>
        )}
      </div>
      <div className="catalog-card-body">
        {book.category && <span className="catalog-card-tag">{book.category}</span>}
        <h3 className="catalog-card-title">{book.title}</h3>
        <p className="catalog-card-author">{book.author}</p>
        <div className="catalog-card-availability">
          <span className={`availability-dot ${isAvailable ? 'is-available' : 'is-unavailable'}`} />
          {isAvailable ? `${book.available_copies} of ${book.total_copies} available` : 'Unavailable'}
        </div>
      </div>
    </div>
  );
}
