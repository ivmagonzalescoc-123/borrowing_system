import { useState } from 'react';
import { X, Mail, KeyRound, Lock } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';
import SparkleSpinner from './SparkleSpinner';

export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState('email'); // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { showSuccess, showError } = useToast();

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      // No SMTP is configured for this demo, so the OTP comes back in the
      // response and gets auto-filled instead of being emailed.
      setOtp(res.data.otp);
      setNotice('No email service is set up for this demo, so your OTP was auto-filled below.');
      showSuccess('OTP sent');
      setStep('reset');
    } catch (err) {
      const message = err.response?.data?.message || 'Could not generate an OTP';
      setError(message);
      showError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('OTP is required.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters and include both letters and numbers.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      showSuccess('Password reset successful');
      setStep('done');
    } catch (err) {
      const message = err.response?.data?.message || 'Could not reset password';
      setError(message);
      showError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="auth-form" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
              <h2>Forgot Password</h2>
              <p className="auth-notice">Enter your account email and we'll generate a one-time code.</p>
              {error && <p className="error">{error}</p>}
              <div className="field-group">
                <label htmlFor="forgot-email">Email</label>
                <div className="input-icon-wrapper">
                  <Mail size={16} strokeWidth={1.75} />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="off"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className={`btn-primary${busy ? ' is-loading' : ''}`} disabled={busy}>
                {busy ? (
                  <>
                    <SparkleSpinner size={16} />
                    Sending…
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="auth-form" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
              <h2>Reset Password</h2>
              {notice && <p className="auth-notice">{notice}</p>}
              {error && <p className="error">{error}</p>}
              <div className="field-group">
                <label htmlFor="otp">One-Time Code</label>
                <div className="input-icon-wrapper">
                  <KeyRound size={16} strokeWidth={1.75} />
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={16} strokeWidth={1.75} />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="off"
                    placeholder="At least 8 characters, with letters and numbers"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={16} strokeWidth={1.75} />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="off"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className={`btn-primary${busy ? ' is-loading' : ''}`} disabled={busy}>
                {busy ? (
                  <>
                    <SparkleSpinner size={16} />
                    Resetting…
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="auth-form" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
              <h2>Password Reset</h2>
              <p className="auth-notice">
                Your password has been updated. You can now log in with your new password.
              </p>
              <button type="button" className="btn-primary" onClick={onClose}>
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
