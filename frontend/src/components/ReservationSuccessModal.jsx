import { CheckCircle2, AlertTriangle, Printer } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateFormat';
import Modal from './Modal';

export default function ReservationSuccessModal({ record, onClose }) {
  if (!record) return null;

  return (
    <Modal onClose={onClose} className="success-card" label="Reservation confirmed">
      <CheckCircle2 className="success-icon" size={40} strokeWidth={1.5} />
      <h2 className="success-title">Reservation Confirmed</h2>

      <div className="success-box">
        <p>
          <span className="field-label">Title:</span> {record.book_title}
        </p>
        <p>
          <span className="field-label">Borrow dates:</span> {formatDate(record.request_start_date)} –{' '}
          {formatDate(record.request_end_date)}
        </p>
        {record.request_time && (
          <p>
            <span className="field-label">Return time:</span> {formatTime(record.request_time)}
          </p>
        )}
        <p>
          <span className="field-label">Pick up by:</span> <strong>{formatDate(record.pickup_deadline)}</strong>
        </p>
      </div>

      <div className="success-ref-box">
        <span className="field-label">Reference No.</span>
        <strong>{record.reference_no}</strong>
      </div>

      <p className="success-warning">
        <AlertTriangle size={14} strokeWidth={1.75} />
        Show this reference number at the library desk. If you don&apos;t pick the book up by{' '}
        {formatDate(record.pickup_deadline)}, the reservation expires and the copy goes to the next student.
      </p>

      <button className="btn-primary" onClick={() => window.print()}>
        <Printer size={16} strokeWidth={1.75} />
        Print
      </button>
    </Modal>
  );
}
