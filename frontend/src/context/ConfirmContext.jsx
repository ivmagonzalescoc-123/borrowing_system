import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(null);

// App-wide "Are you sure?" dialog. Any component can ask:
//   if (!(await confirm({ title, message, details, confirmLabel, tone, icon }))) return;
// and the shared ConfirmModal resolves true (confirmed) or false (cancelled).
export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        resolveRef.current?.(false); // a newer question replaces an unanswered one
        resolveRef.current = resolve;
        setOptions(next);
      }),
    []
  );

  function answer(value) {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && <ConfirmModal {...options} onConfirm={() => answer(true)} onClose={() => answer(false)} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
