import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthWaveHero from '../components/AuthWaveHero';

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
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await register(form);
      navigate(user.role === 'staff' ? '/staff' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Password
          <input
            type="password"
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
        <button type="submit" className="btn-primary">Register</button>
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
      </div>
    </div>
  );
}
