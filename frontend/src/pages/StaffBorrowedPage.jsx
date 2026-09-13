import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';
import SparkleSpinner from '../components/SparkleSpinner';
import RecordListSkeleton from '../components/RecordListSkeleton';
import { EmptyState, ErrorState } from '../components/DataState';
import { useToast } from '../context/ToastContext';

export default function StaffBorrowedPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [returningId, setReturningId] = useState(null);
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

  async function handleMarkReturned(id) {
    setReturningId(id);
    try {
      await api.patch(`/borrows/${id}/return`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showSuccess('Book marked as returned');
      loadData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to mark book as returned');
    } finally {
      setReturningId(null);
    }
  }

  const borrowed = records.filter((r) => r.status === 'borrowed' || r.status === 'returned');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Borrowed Books</h1>
      </div>

      <div className="record-list">
        {loading ? (
          <RecordListSkeleton />
        ) : loadError ? (
          <ErrorState onRetry={loadData} />
        ) : (
          <>
            {borrowed.map((record) => (
              <BorrowRecordRow
                key={record.id}
                record={record}
                showStudent
                action={
                  record.status === 'borrowed' && (
                    <button
                      className={`btn-primary${returningId === record.id ? ' is-loading' : ''}`}
                      disabled={returningId === record.id}
                      onClick={() => handleMarkReturned(record.id)}
                    >
                      {returningId === record.id ? (
                        <>
                          <SparkleSpinner size={16} />
                          Returning…
                        </>
                      ) : (
                        'Mark Returned'
                      )}
                    </button>
                  )
                }
              />
            ))}
            {borrowed.length === 0 && <EmptyState message="No borrowed books yet." />}
          </>
        )}
      </div>
    </div>
  );
}
