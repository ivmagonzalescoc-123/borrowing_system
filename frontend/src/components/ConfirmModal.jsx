import Modal from './Modal';
import SparkleSpinner from './SparkleSpinner';

// One plain confirmation look for every action in the app: the question, a
// short explanation, an optional details box, and Cancel / Confirm side by
// side. The tone colors the top strip, details border and confirm button:
//   tone="primary" (green)  — normal actions: add, save, reserve, hand over
//   tone="warning" (yellow) — reversible but notable: archive, renew
//   tone="danger"  (red)    — can't be undone: decline, cancel
export default function ConfirmModal({
  title,
  message,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone: toneProp,
  danger = false,
  submitting,
  onConfirm,
  onClose,
}) {
  const tone = toneProp || (danger ? 'danger' : 'primary');

  return (
    <Modal onClose={submitting ? () => {} : onClose} className={`confirm-card is-${tone}`} label={title}>
      <h2 className="confirm-title">{title}</h2>
      {message && <p className="confirm-message">{message}</p>}
      {details && (
        <div className="confirm-details">
          {/* `details` is either JSX or a list of [label, value] pairs. */}
          {Array.isArray(details) ? (
            <dl>
              {details.map(([label, value]) => (
                <div key={label} className="confirm-detail-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            details
          )}
        </div>
      )}

      <div className="confirm-actions">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting} autoFocus={tone === 'danger'}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`confirm-button${submitting ? ' is-loading' : ''}`}
          onClick={onConfirm}
          disabled={submitting}
          autoFocus={tone !== 'danger'}
        >
          {submitting ? <SparkleSpinner size={16} /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
