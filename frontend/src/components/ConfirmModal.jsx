import { X, AlertTriangle } from 'lucide-react';
import Portal from './Portal';
import SparkleSpinner from './SparkleSpinner';

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  submitting,
  onConfirm,
  onClose,
}) {
  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>

          <AlertTriangle className="confirm-modal-icon" size={36} strokeWidth={1.5} />
          <h4 className="section-title confirm-modal-title">{title}</h4>
          <p className="modal-subtitle confirm-modal-message">{message}</p>

          <div className="confirm-modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn-primary${submitting ? ' is-loading' : ''}`}
              onClick={onConfirm}
              disabled={submitting}
            >
              {submitting ? <SparkleSpinner size={16} /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
