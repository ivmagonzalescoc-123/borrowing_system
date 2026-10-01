import { useState } from 'react';
import Modal from './Modal';
import SparkleSpinner from './SparkleSpinner';

// Asks staff for a short reason before declining a reservation. Quick-pick
// chips cover the common cases so the desk doesn't have to type.
const QUICK_REASONS = ['Copy is damaged or missing', 'Reserved for class use', 'Student did not meet borrowing requirements'];

export default function ReasonModal({ title, subtitle, confirmLabel, submitting, error, onConfirm, onClose }) {
  const [reason, setReason] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm(reason.trim());
  }

  return (
    <Modal onClose={onClose} label={title}>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="modal-subtitle">{subtitle}</p>}

      <form className="reservation-form" onSubmit={handleSubmit}>
        <div className="chip-row">
          {QUICK_REASONS.map((quick) => (
            <button
              key={quick}
              type="button"
              className={`chip${reason === quick ? ' is-active' : ''}`}
              onClick={() => setReason(quick)}
            >
              {quick}
            </button>
          ))}
        </div>
        <label>
          Reason (shown to the student)
          <textarea rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="confirm-modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={`btn-danger${submitting ? ' is-loading' : ''}`} disabled={submitting || !reason.trim()}>
            {submitting ? <SparkleSpinner size={16} /> : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
