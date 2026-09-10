import StatusBadge from './StatusBadge';
import { coverColor, coverInitial } from '../utils/bookCover';
import { formatDate, formatTime } from '../utils/dateFormat';

export default function BorrowRecordRow({ record, showStudent = false, action }) {
  return (
    <div className="record-row">
      <div className="record-cover" style={record.book_cover_url ? undefined : { background: coverColor(record.book_title) }}>
        {record.book_cover_url ? (
          <img src={record.book_cover_url} alt="" />
        ) : (
          <span>{coverInitial(record.book_title)}</span>
        )}
      </div>
      <div className="record-info">
        <p className="record-title">{record.book_title}</p>
        {showStudent && (
          <p className="record-line">
            {record.student_name} <span className="muted">({record.student_id_number})</span>
          </p>
        )}
        {record.purpose && <p className="record-line muted">Purpose: {record.purpose}</p>}
        <p className="record-line muted">
          Requested {formatDate(record.request_start_date)} – {formatDate(record.request_end_date)} at{' '}
          {formatTime(record.request_time)}
        </p>
        <p className="record-line muted">Ref No. {record.reference_no}</p>
      </div>
      <div className="record-actions">
        <StatusBadge status={record.status} />
        {action}
      </div>
    </div>
  );
}
