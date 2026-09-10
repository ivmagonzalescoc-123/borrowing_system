import { X, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateFormat';
import Portal from './Portal';

export default function ReservationSuccessModal({ record, onClose }) {
  if (!record) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <Portal>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card success-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.75} />
        </button>

        <CheckCircle2 className="success-icon" size={40} strokeWidth={1.5} />
        <h2 className="success-title">Reservation Confirmed</h2>

        <div className="success-box">
          <p>
            <span className="field-label">Title:</span> {record.book_title}
          </p>
          <p>
            <span className="field-label">Date:</span> {formatDate(record.request_start_date)} -{' '}
            {formatDate(record.request_end_date)}
          </p>
          <p>
            <span className="field-label">Time:</span> {formatTime(record.request_time)}
          </p>
        </div>

        <div className="success-ref-box">
          <span className="field-label">Reference No.</span>
          <strong>{record.reference_no}</strong>
        </div>

        <p className="success-warning">
          <AlertTriangle size={14} strokeWidth={1.75} />
          Show this reference number to the librarian and return the book on the scheduled date.
        </p>

        <button className="btn-primary" onClick={handlePrint}>
          <Printer size={16} strokeWidth={1.75} />
          Print
        </button>
      </div>
    </div>
    </Portal>
  );
}
