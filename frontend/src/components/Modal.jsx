import { X } from 'lucide-react';
import Portal from './Portal';
import useModalA11y from '../hooks/useModalA11y';

// Shared dialog shell: overlay click / Esc / close button all call onClose,
// focus is trapped inside while open and restored afterwards.
export default function Modal({ onClose, className = '', label, children }) {
  const ref = useModalA11y(onClose);

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div
          ref={ref}
          className={`modal-card ${className}`.trim()}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>
          {children}
        </div>
      </div>
    </Portal>
  );
}
