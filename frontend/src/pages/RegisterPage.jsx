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
    role: 'student',
    course: '',
    department: '',
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
      const user = await register(form);
      showSuccess('Registration successful');
      navigate(user.role === 'staff' ? '/staff' : '/student');
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
        <label>
          Role
          <select value={form.role} onChange={update('role')}>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
        </label>
        <label>
          {form.role === 'staff' ? 'Staff ID' : 'Student ID'}
          <input value={form.idNumber} onChange={update('idNumber')} required />
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
            minLength={6}
          />
        </label>
        {form.role === 'student' ? (
          <label>
            Course
            <input value={form.course} onChange={update('course')} />
          </label>
        ) : (
          <label>
            Department
            <input value={form.department} onChange={update('department')} />
          </label>
        )}
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
