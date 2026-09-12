import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthWaveHero from '../components/AuthWaveHero';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import GoogleLoginModal from '../components/GoogleLoginModal';
import SparkleSpinner from '../components/SparkleSpinner';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Email is required.';
    if (!password) nextErrors.password = 'Password is required.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(email, password);
      showSuccess('Login successful');
      navigate(user.role === 'staff' ? '/staff' : '/student');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      showError(message);
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    setShowGoogleModal(true);
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    setShowForgotModal(true);
  }

  return (
    <div className="auth-page-wave">
      <AuthWaveHero />
      <div className="auth-card-wrap">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}

        <div className="field-group">
          <label htmlFor="email">Email</label>
          <div className={`input-icon-wrapper${fieldErrors.email ? ' has-error' : ''}`}>
            <Mail size={16} strokeWidth={1.75} />
            <input
              id="email"
              type="email"
              autoComplete="off"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
          </div>
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <div className={`input-icon-wrapper${fieldErrors.password ? ' has-error' : ''}`}>
            <Lock size={16} strokeWidth={1.75} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="off"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            <button
              type="button"
              className="input-icon-action"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
            </button>
          </div>
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
        </div>

        <a href="#" className="forgot-password-link" onClick={handleForgotPassword}>
          Forgot Password?
        </a>

        <button type="submit" className={`btn-primary${submitting ? ' is-loading' : ''}`} disabled={submitting}>
          {submitting ? (
            <>
              <SparkleSpinner size={16} />
              Logging in…
            </>
          ) : (
            'Login'
          )}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button type="button" className="btn-google" onClick={handleGoogleLogin} disabled={submitting}>
          <GoogleIcon />
          Continue with Google
        </button>
      </form>
      </div>

      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
      {showGoogleModal && <GoogleLoginModal onClose={() => setShowGoogleModal(false)} />}
    </div>
  );
}
