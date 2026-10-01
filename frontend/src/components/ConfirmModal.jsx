import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import SparkleSpinner from './SparkleSpinner';

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  submitting,
  onConfirm,
  onClose,
}) {
  return (
    <Modal onClose={onClose} label={title}>
      <AlertTriangle className={`confirm-modal-icon${danger ? ' is-danger' : ''}`} size={36} strokeWidth={1.5} />
      <h4 className="section-title confirm-modal-title">{title}</h4>
      <p className="modal-subtitle confirm-modal-message">{message}</p>

      <div className="confirm-modal-actions">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`${danger ? 'btn-danger' : 'btn-primary'}${submitting ? ' is-loading' : ''}`}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? <SparkleSpinner size={16} /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
