import StatusBadge from './StatusBadge';
import { coverColor, coverInitial } from '../utils/bookCover';
import { formatDate, formatDateTime, formatTime } from '../utils/dateFormat';
import { dueText, isOverdue, pickupText } from '../utils/records';

// The dates that matter depend on where the record is in its lifecycle, so
// each status shows its own key line instead of always the requested dates.
function KeyDates({ record }) {
  switch (record.status) {
    case 'reserved':
      return (
        <>
          <p className="record-line record-key-line is-reserved">{pickupText(record)}</p>
          <p className="record-line muted">
            Requested {formatDate(record.request_start_date)} – {formatDate(record.request_end_date)}
            {record.request_time && ` · return by ${formatTime(record.request_time)}`}
          </p>
        </>
      );
    case 'borrowed':
      return (
        <>
          <p className={`record-line record-key-line ${isOverdue(record) ? 'is-overdue' : 'is-borrowed'}`}>
            Due {formatDate(record.due_date)} · {dueText(record)}
          </p>
          <p className="record-line muted">
            Borrowed {formatDateTime(record.borrowed_at)}
            {record.renewal_count > 0 && ` · renewed ${record.renewal_count}×`}
          </p>
        </>
      );
    case 'returned':
      return (
        <p className="record-line muted">
          Borrowed {formatDate(record.borrowed_at)} · Returned {formatDate(record.returned_at)}
          {record.due_date && record.returned_at?.slice(0, 10) > record.due_date.slice(0, 10) && ' (late)'}
        </p>
      );
    default:
      return (
        <p className="record-line muted">
          {formatDate(record.closed_at)}
          {record.close_reason && ` — ${record.close_reason}`}
        </p>
      );
  }
}

export default function BorrowRecordRow({ record, showStudent = false, action, onStudentClick }) {
  return (
    <div className={`record-row${isOverdue(record) ? ' is-overdue' : ''}`}>
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
            {onStudentClick ? (
              <button type="button" className="link-button" onClick={() => onStudentClick(record)}>
                {record.student_name}
              </button>
            ) : (
              record.student_name
            )}{' '}
            <span className="muted">({record.student_id_number})</span>
          </p>
        )}
        <KeyDates record={record} />
        {record.purpose && <p className="record-line muted">Purpose: {record.purpose}</p>}
        <p className="record-line muted">Ref No. {record.reference_no}</p>
      </div>
      <div className="record-actions">
        <StatusBadge record={record} />
        {action}
      </div>
    </div>
  );
}
