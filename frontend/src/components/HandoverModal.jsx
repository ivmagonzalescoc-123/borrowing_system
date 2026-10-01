import { useState } from 'react';
import { KeyRound, CalendarClock } from 'lucide-react';
import Modal from './Modal';
import SparkleSpinner from './SparkleSpinner';
import { addDays, todayString } from '../utils/records';
import { formatDate } from '../utils/dateFormat';

// Mirrors the server's default: the student's requested end date when it's
// still ahead, otherwise the default loan length — capped at the max.
function suggestedDueDate(record, policy) {
  const today = todayString();
  const requested = record.request_end_date?.slice(0, 10);
  const due = requested && requested > today ? requested : addDays(today, policy?.defaultLoanDays ?? 7);
  const latest = addDays(today, policy?.maxLoanDays ?? 14);
  return due > latest ? latest : due;
}

export default function HandoverModal({ record, policy, onClose, onConfirm, submitting, error }) {
  const [referenceNo, setReferenceNo] = useState('');
  const [dueDate, setDueDate] = useState(() => suggestedDueDate(record, policy));
  const [localError, setLocalError] = useState('');
  const today = todayString();

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');

    if (!referenceNo.trim()) {
      setLocalError('Reference number is required.');
      return;
    }
    if (referenceNo.trim().toUpperCase() !== record.reference_no.toUpperCase()) {
      setLocalError('Reference number does not match this reservation.');
      return;
    }
    onConfirm({ dueDate });
  }

  return (
    <Modal onClose={onClose} label="Hand over book">
      <h2 className="section-title">Hand Over Book</h2>
      <p className="modal-title">{record.book_title}</p>
      <p className="modal-subtitle">
        {record.student_name} ({record.student_id_number})
      </p>
      <p className="record-line muted">
        Requested {formatDate(record.request_start_date)} – {formatDate(record.request_end_date)}
      </p>

      <form className="reservation-form" onSubmit={handleSubmit}>
        <label>
          <span className="label-with-icon">
            <KeyRound size={14} strokeWidth={1.75} /> Reference Number
          </span>
          <input
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="Ask the student for their reference number"
            autoFocus
          />
        </label>
        <label>
          <span className="label-with-icon">
            <CalendarClock size={14} strokeWidth={1.75} /> Due date
          </span>
          <input
            type="date"
            value={dueDate}
            min={addDays(today, 1)}
            max={addDays(today, policy?.maxLoanDays ?? 14)}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </label>

        {(localError || error) && <p className="error">{localError || error}</p>}

        <button type="submit" className={`btn-primary${submitting ? ' is-loading' : ''}`} disabled={submitting}>
          {submitting ? (
            <>
              <SparkleSpinner size={16} />
              Handing over…
            </>
          ) : (
            'Confirm Hand Over'
          )}
        </button>
      </form>
    </Modal>
  );
}
