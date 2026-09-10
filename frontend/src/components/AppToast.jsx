import { CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';

export default function AppToast() {
  const { toast } = useToast();
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <Portal>
      <div className="app-toast-overlay">
        <div
          key={toast.id}
          className={`app-toast-card ${isSuccess ? 'app-toast-success' : 'app-toast-error'}`}
        >
          <p className="app-toast-message">{toast.message}</p>
          {isSuccess ? (
            <CheckCircle2 className="app-toast-icon" size={44} strokeWidth={1.5} />
          ) : (
            <XCircle className="app-toast-icon" size={44} strokeWidth={1.5} />
          )}
        </div>
      </div>
    </Portal>
  );
}
