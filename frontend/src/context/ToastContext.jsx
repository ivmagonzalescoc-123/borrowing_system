import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((type, message, duration = 2200) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ type, message, id: Date.now() });
    timeoutRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const showSuccess = useCallback((message, duration) => showToast('success', message, duration), [showToast]);
  const showError = useCallback((message, duration) => showToast('error', message, duration), [showToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, showSuccess, showError }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
