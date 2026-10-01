import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, CalendarClock, Clock, ChevronRight } from 'lucide-react';
import SearchField from '../components/SearchField';
import StatusBadge from '../components/StatusBadge';
import { ErrorState } from '../components/DataState';
import { useAuth } from '../context/AuthContext';
import useAllBorrows from '../hooks/useAllBorrows';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { dueText, isOverdue, matchesRecordQuery, todayString } from '../utils/records';

// The most recent thing that happened to a record, for the activity feed.
function latestEvent(record) {
  const events = [
    [record.reserved_at, 'reserved'],
    [record.borrowed_at, 'picked up'],
    [record.returned_at, 'returned'],
    [record.closed_at, { cancelled: 'cancelled', rejected: 'had a reservation declined:', expired: 'missed the pickup for' }[record.status]],
  ]
    .filter(([at, verb]) => at && verb)
    // Later lifecycle steps win ties (e.g. reserved and picked up the same second).
    .reverse();
  events.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  return { at: events[0][0], verb: events[0][1] };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Where a record is handled, with the search pre-filled to its reference.
function recordLink(record) {
  if (record.status === 'reserved') return `/staff/reservations?q=${record.reference_no}`;
  if (record.status === 'borrowed') return `/staff/borrowed?q=${record.reference_no}`;
  if (record.status === 'returned') return `/staff/borrowed?tab=returned&q=${record.reference_no}`;
  // Cancelled / declined / expired records only appear in the student's history.
  return `/staff/students?q=${encodeURIComponent(record.student_id_number)}`;
}

const LOOKUP_LIMIT = 8;

// Desk lookup ranking: overdue, then on loan / awaiting pickup, then past
// records (newest first — the list is already sorted that way).
function lookupRank(record) {
  if (isOverdue(record)) return 0;
  if (record.status === 'borrowed' || record.status === 'reserved') return 1;
  return 2;
}

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { records, loading, loadError, reload } = useAllBorrows();
  const [lookup, setLookup] = useState('');
  const navigate = useNavigate();
  const today = todayString();

  const reserved = records.filter((r) => r.status === 'reserved');
  const onLoan = records.filter((r) => r.status === 'borrowed');
  const overdue = onLoan.filter(isOverdue).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const dueToday = onLoan.filter((r) => r.due_date?.slice(0, 10) === today);
  const pickupsClosing = reserved.filter((r) => r.pickup_deadline?.slice(0, 10) === today);

  const lookupMatches = lookup.trim()
    ? records.filter((r) => matchesRecordQuery(r, lookup)).sort((a, b) => lookupRank(a) - lookupRank(b))
    : [];
  const lookupResults = lookupMatches.slice(0, LOOKUP_LIMIT);

  const activity = records
    .map((r) => ({ record: r, ...latestEvent(r) }))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 8);

  const tiles = [
    { label: 'Awaiting pickup', value: reserved.length, icon: Clock, iconClass: 'is-yellow', to: '/staff/reservations' },
    { label: 'On loan', value: onLoan.length, icon: BookOpen, to: '/staff/borrowed' },
    { label: 'Overdue', value: overdue.length, icon: AlertCircle, danger: overdue.length > 0, to: '/staff/borrowed?tab=overdue' },
    { label: 'Due today', value: dueToday.length, icon: CalendarClock, to: '/staff/borrowed' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {greeting()}, {user.full_name.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {loadError ? (
        <ErrorState onRetry={reload} />
      ) : (
        <>
          <div className="panel lookup-panel">
            <h2 className="panel-title">Desk lookup</h2>
            <SearchField
              value={lookup}
              onChange={setLookup}
              placeholder="Reference no., student name or ID, or book title"
              autoFocus
            />
            {lookup.trim() && (
              <ul className="compact-list">
                {lookupResults.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="compact-row" onClick={() => navigate(recordLink(r))}>
                      <span className="compact-main">
                        <strong>{r.book_title}</strong>
                        <span className="muted">
                          {r.student_name} · {r.reference_no}
                        </span>
                      </span>
                      <StatusBadge record={r} />
                      <ChevronRight size={16} strokeWidth={1.75} className="muted" />
                    </button>
                  </li>
                ))}
                {lookupMatches.length > LOOKUP_LIMIT && (
                  <li className="compact-empty">
                    {lookupMatches.length - LOOKUP_LIMIT} more —{' '}
                    <Link to={`/staff/students?q=${encodeURIComponent(lookup.trim())}`} className="panel-link">
                      search students
                    </Link>
                  </li>
                )}
                {lookupResults.length === 0 && <li className="compact-empty">No reservation or loan matches.</li>}
              </ul>
            )}
          </div>

          <div className="stat-grid">
            {tiles.map(({ label, value, icon: Icon, iconClass, danger, to }) => (
              <Link key={label} to={to} className={`stat-tile${danger ? ' is-danger' : ''}`}>
                <Icon size={18} strokeWidth={1.75} className={`stat-icon ${iconClass || ''}`} />
                <span className="stat-value">{loading ? '–' : value}</span>
                <span className="stat-label">{label}</span>
              </Link>
            ))}
          </div>

          <div className="dashboard-columns">
            <section className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Needs attention</h2>
                <Link to="/staff/borrowed?tab=overdue" className="panel-link">
                  View overdue
                </Link>
              </div>
              <ul className="compact-list">
                {overdue.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link to={recordLink(r)} className="compact-row">
                      <span className="compact-main">
                        <strong>{r.book_title}</strong>
                        <span className="muted">
                          {r.student_name} ({r.student_id_number})
                        </span>
                      </span>
                      <span className="compact-meta is-danger">{dueText(r)}</span>
                    </Link>
                  </li>
                ))}
                {pickupsClosing.map((r) => (
                  <li key={r.id}>
                    <Link to={recordLink(r)} className="compact-row">
                      <span className="compact-main">
                        <strong>{r.book_title}</strong>
                        <span className="muted">{r.student_name}</span>
                      </span>
                      <span className="compact-meta is-warning">Last pickup day</span>
                    </Link>
                  </li>
                ))}
                {!loading && overdue.length === 0 && pickupsClosing.length === 0 && (
                  <li className="compact-empty">All clear — nothing overdue and no pickups closing today.</li>
                )}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Recent activity</h2>
              </div>
              <ul className="compact-list">
                {activity.map(({ record: r, at, verb }) => (
                  <li key={r.id}>
                    <Link to={recordLink(r)} className="compact-row">
                      <span className="compact-main">
                        <span>
                          <strong>{r.student_name}</strong> {verb} <em>{r.book_title}</em>
                        </span>
                        <span className="muted">{at.length > 10 ? formatDateTime(at) : formatDate(at)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {!loading && activity.length === 0 && <li className="compact-empty">No activity yet.</li>}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
