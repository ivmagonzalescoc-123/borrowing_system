import { Archive } from 'lucide-react';
import { coverColor, coverInitial } from '../utils/bookCover';
import SparkleSpinner from './SparkleSpinner';

export default function BookCatalogCard({ book, onOpen, onArchive, archiving, showCopiesOut = false }) {
  const isAvailable = book.available_copies > 0;
  const copiesOut = Number(book.borrowed_count || 0) + Number(book.reserved_count || 0);

  function handleKeyDown(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(book);
    }
  }

  return (
    <div
      className="catalog-card"
      onClick={() => onOpen(book)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${book.title} by ${book.author}`}
    >
      {onArchive && (
        <button
          className={`catalog-card-archive${archiving ? ' is-loading' : ''}`}
          aria-label={`Archive ${book.title}`}
          title="Move to archive"
          disabled={archiving}
          onClick={(e) => {
            e.stopPropagation();
            onArchive(book);
          }}
        >
          {archiving ? <SparkleSpinner size={14} /> : <Archive size={14} strokeWidth={1.75} />}
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
          {isAvailable ? `${book.available_copies} of ${book.total_copies} available` : 'All copies out'}
        </div>
        {showCopiesOut && copiesOut > 0 && (
          <p className="catalog-card-out">
            {book.borrowed_count} on loan · {book.reserved_count} reserved
          </p>
        )}
        {!showCopiesOut && book.waitlisted ? <p className="catalog-card-out">On your waitlist</p> : null}
      </div>
    </div>
  );
}
