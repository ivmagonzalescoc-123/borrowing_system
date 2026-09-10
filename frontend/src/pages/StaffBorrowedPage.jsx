import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';

export default function StaffBorrowedPage() {
  const [records, setRecords] = useState([]);

  async function loadData() {
    const res = await api.get('/borrows');
    setRecords(res.data.records);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleMarkReturned(id) {
    await api.patch(`/borrows/${id}/return`);
    loadData();
  }

  const borrowed = records.filter((r) => r.status === 'borrowed' || r.status === 'returned');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Borrowed Books</h1>
        <p className="page-subtitle">Books currently checked out, and completed returns.</p>
      </div>

      <div className="record-list">
        {borrowed.map((record) => (
          <BorrowRecordRow
            key={record.id}
            record={record}
            showStudent
            action={
              record.status === 'borrowed' && (
                <button className="btn-primary" onClick={() => handleMarkReturned(record.id)}>
                  Mark Returned
                </button>
              )
            }
          />
        ))}
        {borrowed.length === 0 && <p className="empty-state">No borrowed books yet.</p>}
      </div>
    </div>
  );
}
