import { useState } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import SparkleSpinner from './SparkleSpinner';

// Staff accounts can only be created by existing staff (public sign-up is
// student-only), so this is how a new librarian gets access.
export default function AddStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ idNumber: '', fullName: '', email: '', password: '', department: 'Library' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/staff', form);
      onCreated(res.data.user);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || 'Failed to create staff account');
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} label="Add staff account">
      <h4 className="section-title">Add Staff Account</h4>
      <p className="modal-subtitle">They can sign in right away with this email and password.</p>

      <form className="reservation-form" onSubmit={handleSubmit}>
        <div className="reservation-form-row">
          <label>
            Staff ID
            <input value={form.idNumber} onChange={update('idNumber')} required autoFocus />
          </label>
          <label>
            Department
            <input value={form.department} onChange={update('department')} />
          </label>
        </div>
        <label>
          Full name
          <input value={form.fullName} onChange={update('fullName')} required />
        </label>
        <label>
          Email
          <input type="email" autoComplete="off" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Temporary password
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            minLength={8}
            required
          />
          <span className="field-hint">At least 8 characters, with letters and numbers.</span>
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className={`btn-primary${submitting ? ' is-loading' : ''}`} disabled={submitting}>
          {submitting ? <SparkleSpinner size={16} /> : 'Create account'}
        </button>
      </form>
    </Modal>
  );
}
