import { useEffect, useState } from 'react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';

export default function StudentBorrowedPage() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/borrows/mine').then((res) => setRecords(res.data.records));
  }, []);

  const borrowed = records.filter((r) => r.status === 'borrowed' || r.status === 'returned');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Borrowed Books</h1>
      </div>

      <div className="record-list">
        {borrowed.map((record) => (
          <BorrowRecordRow key={record.id} record={record} />
        ))}
        {borrowed.length === 0 && <p className="empty-state">You have no borrowed books yet.</p>}
      </div>
    </div>
  );
}
