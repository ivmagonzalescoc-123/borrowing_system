import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';
import SparkleSpinner from './SparkleSpinner';

// Demo-only mock of Google's account picker. There is no real OAuth wired up —
// selecting the account just signs in as the seeded demo student account so
// the "Continue with Google" flow has something to show end-to-end.
const DEMO_ACCOUNT = {
  name: 'Juan Dela Cruz',
  email: 'student@example.com',
  password: 'password123',
};

function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

export default function GoogleLoginModal({ onClose }) {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  async function handleChooseAccount() {
    setError('');
    setSigningIn(true);
    try {
      const user = await login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
      showSuccess('Login successful');
      onClose();
      navigate(user.role === 'staff' ? '/staff' : '/student');
    } catch (err) {
      const message = err.response?.data?.message || 'Google sign-in failed';
      setError(message);
      showError(message);
      setSigningIn(false);
    }
  }

  return (
    <Portal>
      <div className="modal-overlay" onClick={signingIn ? undefined : onClose}>
        <div className="modal-card google-picker-card" onClick={(e) => e.stopPropagation()}>
          {!signingIn && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <X size={18} strokeWidth={1.75} />
            </button>
          )}

          <div className="google-picker-header">
            <GoogleIcon size={28} />
            <h2 className="google-picker-title">Choose an account</h2>
            <p className="google-picker-subtitle">to continue to COC Library</p>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="google-account-list">
            <button
              type="button"
              className={`google-account-row${signingIn ? ' is-loading' : ''}`}
              onClick={handleChooseAccount}
              disabled={signingIn}
            >
              {signingIn ? (
                <SparkleSpinner size={24} className="google-account-avatar" />
              ) : (
                <span className="google-account-avatar">
                  {DEMO_ACCOUNT.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </span>
              )}
              <span className="google-account-info">
                <span className="google-account-name">{DEMO_ACCOUNT.name}</span>
                <span className="google-account-email">{DEMO_ACCOUNT.email}</span>
              </span>
            </button>

            <button type="button" className="google-account-row google-account-row-disabled" disabled>
              <span className="google-account-avatar google-account-avatar-muted">+</span>
              <span className="google-account-info">
                <span className="google-account-name">Use another account</span>
              </span>
            </button>
          </div>

          <p className="google-picker-footnote">
            {signingIn
              ? 'Signing you in…'
              : 'Demo mockup — this does not connect to a real Google account.'}
          </p>
        </div>
      </div>
    </Portal>
  );
}
