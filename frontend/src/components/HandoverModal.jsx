import { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import Portal from './Portal';

export default function HandoverModal({ record, onClose, onConfirm, submitting, error }) {
  const [referenceNo, setReferenceNo] = useState('');
  const [localError, setLocalError] = useState('');

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
    onConfirm();
  }

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>

          <h4 className="section-title">Hand Over Book</h4>
          <p className="modal-title">{record.book_title}</p>
          <p className="modal-subtitle">
            {record.student_name} ({record.student_id_number})
          </p>

          <form className="reservation-form" onSubmit={handleSubmit}>
            <label>
              <KeyRound size={14} strokeWidth={1.75} /> Reference Number
              <input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Ask the student for their reference number"
                autoFocus
              />
            </label>

            {(localError || error) && <p className="error">{localError || error}</p>}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Handing over…' : 'Confirm Hand Over'}
            </button>
          </form>
        </div>
      </div>
    </Portal>
  );
}
