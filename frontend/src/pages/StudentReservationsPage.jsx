import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';

export default function StudentReservationsPage() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/borrows/mine').then((res) => setRecords(res.data.records));
  }, []);

  const reservations = records.filter((r) => r.status === 'reserved');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reservations</h1>
      </div>

      <div className="record-list">
        {reservations.map((record) => (
          <BorrowRecordRow key={record.id} record={record} />
        ))}
        {reservations.length === 0 && <p className="empty-state">You have no pending reservations.</p>}
      </div>
    </div>
  );
}
