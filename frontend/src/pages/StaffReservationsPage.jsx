import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';
import HandoverModal from '../components/HandoverModal';
import RecordListSkeleton from '../components/RecordListSkeleton';
import { EmptyState, ErrorState } from '../components/DataState';
import { useToast } from '../context/ToastContext';

export default function StaffReservationsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [handoverTarget, setHandoverTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { showSuccess, showError } = useToast();

  async function loadData() {
    try {
      const res = await api.get('/borrows');
      setRecords(res.data.records);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
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
        {loading ? (
          <RecordListSkeleton />
        ) : loadError ? (
          <ErrorState onRetry={loadData} />
        ) : (
          <>
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
            {reservations.length === 0 && <EmptyState message="No pending reservations." />}
          </>
        )}
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
