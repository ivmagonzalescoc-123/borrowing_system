import BorrowRecordRow from './BorrowRecordRow';
import Modal from './Modal';
import { EmptyState } from './DataState';
import { isOverdue } from '../utils/records';

// Everything one student has (or had) — what staff need when a student is
// standing at the desk asking "what do I still have out?".
export default function StudentRecordsModal({ student, records, onClose }) {
  const mine = records.filter((r) => r.student_id === student.id);
  const active = mine
    .filter((r) => r.status === 'reserved' || r.status === 'borrowed')
    .sort((a, b) => isOverdue(b) - isOverdue(a));
  const past = mine.filter((r) => r.status !== 'reserved' && r.status !== 'borrowed');

  return (
    <Modal onClose={onClose} className="modal-card-wide" label={student.full_name}>
      <p className="modal-title">{student.full_name}</p>
      <p className="modal-subtitle">
        {student.id_number}
        {student.course && ` · ${student.course}`}
        {student.email && ` · ${student.email}`}
      </p>

      <h4 className="section-title">Current ({active.length})</h4>
      <div className="record-list is-compact">
        {active.map((record) => (
          <BorrowRecordRow key={record.id} record={record} />
        ))}
        {active.length === 0 && <EmptyState message="Nothing reserved or on loan." />}
      </div>

      {past.length > 0 && (
        <details className="history-details">
          <summary>History ({past.length})</summary>
          <div className="record-list is-compact">
            {past.map((record) => (
              <BorrowRecordRow key={record.id} record={record} />
            ))}
          </div>
        </details>
      )}
    </Modal>
  );
}
