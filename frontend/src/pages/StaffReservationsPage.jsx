import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';
import HandoverModal from '../components/HandoverModal';
import { useToast } from '../context/ToastContext';

export default function StaffReservationsPage() {
  const [records, setRecords] = useState([]);
  const [handoverTarget, setHandoverTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { showSuccess, showError } = useToast();

  async function loadData() {
    const res = await api.get('/borrows');
    setRecords(res.data.records);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleConfirmHandover() {
    setSubmitting(true);
    setFormError('');
    try {
      await api.patch(
        `/borrows/${handoverTarget.id}/handover`,
        {},
        { headers: { 'Idempotency-Key': crypto.randomUUID() } }
      );
      showSuccess('Book handed over successfully');
      setHandoverTarget(null);
      loadData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to hand over book';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const reservations = records.filter((r) => r.status === 'reserved');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reservations</h1>
      </div>

      <div className="record-list">
        {reservations.map((record) => (
          <BorrowRecordRow
            key={record.id}
            record={record}
            showStudent
            action={
              <button
                className="btn-primary"
                onClick={() => {
                  setFormError('');
                  setHandoverTarget(record);
                }}
              >
                Hand Over
              </button>
            }
          />
        ))}
        {reservations.length === 0 && <p className="empty-state">No pending reservations.</p>}
      </div>

      {handoverTarget && (
        <HandoverModal
          record={handoverTarget}
          submitting={submitting}
          error={formError}
          onClose={() => setHandoverTarget(null)}
          onConfirm={handleConfirmHandover}
        />
      )}
    </div>
  );
}
