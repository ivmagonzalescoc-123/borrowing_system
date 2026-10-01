import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, Clock, CalendarClock } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import { dueText } from '../utils/records';

// "My status" strip at the top of the student catalog: what they have out,
// what's waiting for pickup, and what's due next — plus a hard-to-miss
// banner while anything is overdue.
export default function StudentSummary({ summary, policy }) {
  const { loans, reservations, overdue, nextDue, activeCount } = summary;

  return (
    <div className="summary-block">
      {overdue.length > 0 && (
        <Link to="/student/borrowed" className="alert-banner is-danger">
          <AlertCircle size={18} strokeWidth={1.75} />
          <span>
            <strong>
              {overdue.length} overdue {overdue.length === 1 ? 'book' : 'books'}.
            </strong>{' '}
            Please return {overdue.length === 1 ? 'it' : 'them'} to the library desk — new reservations are paused until
            you do.
          </span>
        </Link>
      )}
      <div className="stat-grid">
        <Link to="/student/borrowed" className="stat-tile">
          <BookOpen size={18} strokeWidth={1.75} className="stat-icon" />
          <span className="stat-value">{loans.length}</span>
          <span className="stat-label">On loan</span>
        </Link>
        <Link to="/student/reservations" className="stat-tile">
          <Clock size={18} strokeWidth={1.75} className="stat-icon is-yellow" />
          <span className="stat-value">{reservations.length}</span>
          <span className="stat-label">Awaiting pickup</span>
        </Link>
        <Link to="/student/borrowed" className={`stat-tile${nextDue && overdue.length > 0 ? ' is-danger' : ''}`}>
          <CalendarClock size={18} strokeWidth={1.75} className="stat-icon" />
          <span className="stat-value stat-value-sm">{nextDue ? formatDate(nextDue.due_date) : '—'}</span>
          <span className="stat-label">{nextDue ? `Next due · ${dueText(nextDue)}` : 'Nothing due'}</span>
        </Link>
        {policy && (
          <div className="stat-tile is-static">
            <span className="stat-value">
              {activeCount}
              <span className="stat-of">/{policy.maxActiveItems}</span>
            </span>
            <span className="stat-label">Borrowing slots used</span>
          </div>
        )}
      </div>
    </div>
  );
}
