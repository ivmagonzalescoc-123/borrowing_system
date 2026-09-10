import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';

export default function StaffReservationsPage() {
  const [records, setRecords] = useState([]);

  async function loadData() {
    const res = await api.get('/borrows');
    setRecords(res.data.records);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleHandover(id) {
    await api.patch(`/borrows/${id}/handover`);
    loadData();
  }

  const reservations = records.filter((r) => r.status === 'reserved');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reservations</h1>
        <p className="page-subtitle">Students waiting to pick up a reserved book at the counter.</p>
      </div>

      <div className="record-list">
        {reservations.map((record) => (
          <BorrowRecordRow
            key={record.id}
            record={record}
            showStudent
            action={
              <button className="btn-primary" onClick={() => handleHandover(record.id)}>
                Hand Over
              </button>
            }
          />
        ))}
        {reservations.length === 0 && <p className="empty-state">No pending reservations.</p>}
      </div>
    </div>
  );
}
