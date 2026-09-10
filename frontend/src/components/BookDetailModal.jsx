import { useState } from 'react';
import { X, ArrowLeft, Bookmark, BookmarkCheck, CalendarRange, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';
import { coverColor, coverInitial } from '../utils/bookCover';
import { formatDate } from '../utils/dateFormat';
import Portal from './Portal';

export default function BookDetailModal({ book, onClose, onSubmitReservation, submitting, error, readOnly }) {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [step, setStep] = useState('details');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false);

  if (!book) return null;

  const isAvailable = book.available_copies > 0;
  const bookmarked = isBookmarked(book.id);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmitReservation({
      bookId: book.id,
      purpose,
      requestStartDate: startDate,
      requestEndDate: endDate,
      requestTime: returnTime,
      policyAgreed,
    });
  }

  return (
    <Portal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.75} />
        </button>

        {step === 'details' ? (
          <>
            <div className="modal-header-grid">
              <div className="modal-cover" style={book.cover_url ? undefined : { background: coverColor(book.title) }}>
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" />
                ) : (
                  <span>{coverInitial(book.title)}</span>
                )}
              </div>
              <div className="modal-meta-grid">
                <div>
                  <p className="modal-title">{book.title}</p>
                  <p className="modal-subtitle">{book.author}</p>
                  {book.category && <span className="catalog-card-tag">{book.category}</span>}
                </div>
                <dl className="modal-fact-list">
                  <div>
                    <dt>Publisher</dt>
                    <dd>{book.publisher || '—'}</dd>
                  </div>
                  <div>
                    <dt>ISBN</dt>
                    <dd>{book.isbn || '—'}</dd>
                  </div>
                  <div>
                    <dt>Date Released</dt>
                    <dd>{formatDate(book.published_date)}</dd>
                  </div>
                  <div>
                    <dt>Availability</dt>
                    <dd className={isAvailable ? 'is-available-text' : 'is-unavailable-text'}>
                      {isAvailable ? `${book.available_copies} of ${book.total_copies} available` : 'Unavailable'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <h4 className="section-title">Description</h4>
            <p className="modal-description">{book.description || 'No description available for this book.'}</p>

            {!readOnly && (
              <div className="modal-action-row">
                <button
                  className={`btn-ghost bookmark-button${bookmarked ? ' is-bookmarked' : ''}`}
                  onClick={() => toggleBookmark(book.id)}
                >
                  {bookmarked ? (
                    <BookmarkCheck size={16} strokeWidth={1.75} />
                  ) : (
                    <Bookmark size={16} strokeWidth={1.75} />
                  )}
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
                <button className="btn-primary" disabled={!isAvailable} onClick={() => setStep('form')}>
                  {isAvailable ? 'Reserve this Book' : 'Not available'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <button className="modal-back" onClick={() => setStep('details')}>
              <ArrowLeft size={16} strokeWidth={1.75} />
              Back to details
            </button>
            <h4 className="section-title">Reservation Details</h4>
            <p className="modal-subtitle">{book.title}</p>

            <form className="reservation-form" onSubmit={handleSubmit}>
              <div className="reservation-form-row">
                <span>
                  <strong>Borrower</strong>
                  <br />
                  {user.full_name}
                </span>
                <span>
                  <strong>School ID</strong>
                  <br />
                  {user.id_number}
                </span>
              </div>

              <label>
                Purpose
                <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </label>

              <div className="reservation-form-row">
                <label>
                  <CalendarRange size={14} strokeWidth={1.75} /> Borrow date (from)
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </label>
                <label>
                  <CalendarRange size={14} strokeWidth={1.75} /> Borrow date (to)
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </label>
              </div>

              <label>
                <Clock size={14} strokeWidth={1.75} /> Time to return
                <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} required />
              </label>

              <label className="policy-agreement">
                <input
                  type="checkbox"
                  checked={policyAgreed}
                  onChange={(e) => setPolicyAgreed(e.target.checked)}
                />
                <span>
                  I understand this book must be returned to the desk on time. Failure to return on
                  time may result in a suspension of my reservation privileges.
                </span>
              </label>

              {error && <p className="error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Reservation'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
    </Portal>
  );
}
