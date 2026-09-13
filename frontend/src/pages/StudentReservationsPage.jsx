import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';
import RecordListSkeleton from '../components/RecordListSkeleton';
import { EmptyState, ErrorState } from '../components/DataState';

export default function StudentReservationsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function loadRecords() {
    try {
      const res = await api.get('/borrows/mine');
      setRecords(res.data.records);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

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
          <ErrorState onRetry={loadRecords} />
        ) : (
          <>
            {reservations.map((record) => (
              <BorrowRecordRow key={record.id} record={record} />
            ))}
            {reservations.length === 0 && <EmptyState message="You have no pending reservations." />}
          </>
        )}
      </div>
    </div>
  );
}
