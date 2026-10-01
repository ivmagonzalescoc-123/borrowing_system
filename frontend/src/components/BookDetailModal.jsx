import { useState } from 'react';
import { Archive, ArrowLeft, Bookmark, BookmarkCheck, BellRing, BellOff, CalendarRange, Clock, Pencil, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';
import { coverColor, coverInitial } from '../utils/bookCover';
import { formatDate } from '../utils/dateFormat';
import { addDays, daysBetween, todayString } from '../utils/records';
import Modal from './Modal';
import SparkleSpinner from './SparkleSpinner';

const PURPOSES = ['Research', 'Assignment / homework', 'Thesis / capstone', 'Exam review', 'Class reading'];
const OTHER = 'Other';

export default function BookDetailModal({
  book,
  policy,
  blocker,
  onClose,
  onSubmitReservation,
  submitting,
  error,
  readOnly,
  onEdit,
  onArchive,
  onToggleWaitlist,
  waitlistBusy,
}) {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const today = todayString();
  const defaultLoanDays = policy?.defaultLoanDays ?? 7;
  const maxLoanDays = policy?.maxLoanDays ?? 14;
  const maxAdvanceDays = policy?.maxAdvanceDays ?? 30;

  const [step, setStep] = useState('details');
  const [purposeChoice, setPurposeChoice] = useState(PURPOSES[0]);
  const [purposeOther, setPurposeOther] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, defaultLoanDays));
  const [returnTime, setReturnTime] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!book) return null;

  const isAvailable = book.available_copies > 0;
  const bookmarked = isBookmarked(book.id);
  const copiesOut = Number(book.borrowed_count || 0) + Number(book.reserved_count || 0);

  function handleStartChange(value) {
    setStartDate(value);
    // Keep the end date valid relative to the new start date.
    if (value && (endDate < value || daysBetween(value, endDate) > maxLoanDays)) {
      setEndDate(addDays(value, Math.min(defaultLoanDays, maxLoanDays)));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    const purpose = purposeChoice === OTHER ? purposeOther.trim() : purposeChoice;
    if (!purpose) {
      setLocalError('Please describe your purpose.');
      return;
    }
    if (endDate < startDate) {
      setLocalError('The end date must be on or after the start date.');
      return;
    }
    onSubmitReservation({
      bookId: book.id,
      purpose,
      requestStartDate: startDate,
      requestEndDate: endDate,
      requestTime: returnTime || undefined,
      policyAgreed,
    });
  }

  return (
    <Modal onClose={onClose} className="modal-card-wide" label={book.title}>
      {step === 'details' ? (
        <>
          <div className="modal-header-grid">
            <div className="modal-cover" style={book.cover_url ? undefined : { background: coverColor(book.title) }}>
              {book.cover_url ? <img src={book.cover_url} alt="" /> : <span>{coverInitial(book.title)}</span>}
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
                    {isAvailable ? `${book.available_copies} of ${book.total_copies} on the shelf` : 'All copies are out'}
                  </dd>
                </div>
                {readOnly && (
                  <div>
                    <dt>Copies out</dt>
                    <dd>
                      {copiesOut === 0
                        ? 'None'
                        : `${book.borrowed_count} on loan · ${book.reserved_count} awaiting pickup`}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <h4 className="section-title">Description</h4>
          <p className="modal-description">{book.description || 'No description available for this book.'}</p>

          {!readOnly && blocker && isAvailable && (
            <p className="inline-notice">
              <Info size={16} strokeWidth={1.75} />
              {blocker}
            </p>
          )}
          {!readOnly && !isAvailable && (
            <p className="inline-notice">
              <Info size={16} strokeWidth={1.75} />
              {book.waitlisted
                ? "You're on the waitlist. We'll notify you as soon as a copy is back."
                : 'Every copy is currently out. Join the waitlist and we’ll notify you when one is returned.'}
            </p>
          )}

          {!readOnly && (
            <div className="modal-action-row">
              <button
                className={`btn-ghost bookmark-button${bookmarked ? ' is-bookmarked' : ''}`}
                onClick={() => toggleBookmark(book.id)}
              >
                {bookmarked ? <BookmarkCheck size={16} strokeWidth={1.75} /> : <Bookmark size={16} strokeWidth={1.75} />}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              {isAvailable ? (
                <button className="btn-primary" disabled={Boolean(blocker)} onClick={() => setStep('form')}>
                  Reserve this Book
                </button>
              ) : (
                <button
                  className={`${book.waitlisted ? 'btn-ghost' : 'btn-primary btn-yellow'}${waitlistBusy ? ' is-loading' : ''}`}
                  disabled={waitlistBusy}
                  onClick={() => onToggleWaitlist?.(book)}
                >
                  {waitlistBusy ? (
                    <SparkleSpinner size={16} />
                  ) : book.waitlisted ? (
                    <>
                      <BellOff size={16} strokeWidth={1.75} /> Leave waitlist
                    </>
                  ) : (
                    <>
                      <BellRing size={16} strokeWidth={1.75} /> Notify me when available
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {readOnly && onEdit && (
            <div className="modal-action-row">
              {onArchive && (
                <button className="btn-ghost" onClick={() => onArchive(book)}>
                  <Archive size={16} strokeWidth={1.75} />
                  Archive
                </button>
              )}
              <button className="btn-primary btn-yellow" onClick={() => onEdit(book)}>
                <Pencil size={16} strokeWidth={1.75} />
                Edit Book
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
              <select value={purposeChoice} onChange={(e) => setPurposeChoice(e.target.value)}>
                {[...PURPOSES, OTHER].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            {purposeChoice === OTHER && (
              <label>
                Describe your purpose
                <input value={purposeOther} maxLength={255} onChange={(e) => setPurposeOther(e.target.value)} required autoFocus />
              </label>
            )}

            <div className="reservation-form-row">
              <label>
                <span className="label-with-icon">
                  <CalendarRange size={14} strokeWidth={1.75} /> Borrow from
                </span>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  max={addDays(today, maxAdvanceDays)}
                  onChange={(e) => handleStartChange(e.target.value)}
                  required
                />
              </label>
              <label>
                <span className="label-with-icon">
                  <CalendarRange size={14} strokeWidth={1.75} /> Return by
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  max={addDays(startDate || today, maxLoanDays)}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              <span className="label-with-icon">
                <Clock size={14} strokeWidth={1.75} /> Return time <span className="muted">(optional)</span>
              </span>
              <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
            </label>

            <p className="field-hint">
              Pick the book up at the library desk by{' '}
              <strong>{formatDate(addDays(startDate || today, policy?.reservationHoldDays ?? 2))}</strong> or the
              reservation expires. Loans can be up to {maxLoanDays} days.
            </p>

            <label className="policy-agreement">
              <input type="checkbox" checked={policyAgreed} onChange={(e) => setPolicyAgreed(e.target.checked)} />
              <span>
                I&apos;ll return this book to the desk on time. While I have an overdue book, I can&apos;t reserve
                other books.
              </span>
            </label>

            {(localError || error) && <p className="error">{localError || error}</p>}

            <button
              type="submit"
              className={`btn-primary${submitting ? ' is-loading' : ''}`}
              disabled={submitting || !policyAgreed}
            >
              {submitting ? (
                <>
                  <SparkleSpinner size={16} />
                  Reserving…
                </>
              ) : (
                'Confirm Reservation'
              )}
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}
