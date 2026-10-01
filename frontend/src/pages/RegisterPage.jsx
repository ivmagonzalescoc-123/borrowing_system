import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthWaveHero from '../components/AuthWaveHero';
import SparkleSpinner from '../components/SparkleSpinner';

export default function RegisterPage() {
  const [form, setForm] = useState({
    idNumber: '',
    fullName: '',
    email: '',
    password: '',
    course: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      showSuccess('Registration successful');
      navigate('/student');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      showError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-wave">
      <AuthWaveHero />
      <div className="auth-card-wrap">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        {error && <p className="error">{error}</p>}
        <p className="auth-notice">Student sign-up. Library staff accounts are created by an existing librarian.</p>
        <label>
          Student ID
          <input value={form.idNumber} onChange={update('idNumber')} placeholder="e.g. 02-2324-12345" required />
        </label>
        <label>
          Full Name
          <input value={form.fullName} onChange={update('fullName')} required />
        </label>
        <label>
          Email
          <input type="email" autoComplete="off" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="off"
            value={form.password}
            onChange={update('password')}
            required
            minLength={8}
            pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}"
            title="At least 8 characters, with letters and numbers"
          />
          <span className="field-hint">At least 8 characters, with letters and numbers.</span>
        </label>
        <label>
          Course
          <input value={form.course} onChange={update('course')} placeholder="e.g. BSIT" />
        </label>
        <button type="submit" className={`btn-primary${submitting ? ' is-loading' : ''}`} disabled={submitting}>
          {submitting ? (
            <>
              <SparkleSpinner size={16} />
              Registering…
            </>
          ) : (
            'Register'
          )}
        </button>
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
      </div>
    </div>
  );
}
