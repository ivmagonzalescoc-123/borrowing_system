import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

// "?" button next to a page title that opens a short how-to, so guide text
// doesn't take up space on screen until someone asks for it.
export default function PageHelp({ title = 'How this page works', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="page-help" ref={ref}>
      <button
        type="button"
        className={`page-help-button${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={title}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <HelpCircle size={18} strokeWidth={2} />
      </button>
      {open && (
        <div className="page-help-panel" id={panelId} role="note">
          <div className="page-help-header">
            <strong>{title}</strong>
            <button type="button" className="page-help-close" onClick={() => setOpen(false)} aria-label="Close help">
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="page-help-body">{children}</div>
        </div>
      )}
    </div>
  );
}
