import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Library } from 'lucide-react';
import StudentSummary from '../components/StudentSummary';
import StatusBadge from '../components/StatusBadge';
import { ErrorState } from '../components/DataState';
import { useAuth } from '../context/AuthContext';
import useMyBorrows from '../hooks/useMyBorrows';
import { formatDate } from '../utils/dateFormat';
import { dueText, isOverdue, pickupText } from '../utils/records';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { loading, loadError, reload, summary, policy } = useMyBorrows();
  const [searchParams] = useSearchParams();

  // Older "book is available again" notifications link to /student?book=12,
  // from when the catalog lived at /student — send those to the catalog.
  const bookParam = searchParams.get('book');
  if (bookParam) return <Navigate to={`/student/catalog?book=${bookParam}`} replace />;

  const loans = [...summary.loans].sort((a, b) => isOverdue(b) - isOverdue(a) || a.due_date.localeCompare(b.due_date));
  const pickups = [...summary.reservations].sort((a, b) =>
    String(a.pickup_deadline).localeCompare(String(b.pickup_deadline))
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {greeting()}, {user.full_name.split(' ')[0]}
          </h1>
          <p className="page-subtitle">Here&apos;s what you have from the library.</p>
        </div>
        <Link to="/student/catalog" className="btn-primary btn-yellow">
          <Library size={16} strokeWidth={1.75} />
          Browse books
        </Link>
      </div>

      {loadError ? (
        <ErrorState onRetry={reload} />
      ) : (
        <>
          {!loading && <StudentSummary summary={summary} policy={policy} />}

          <div className="dashboard-columns">
            <section className="panel">
              <div className="panel-header">
                <h2 className="panel-title">On loan</h2>
                <Link to="/student/borrowed" className="panel-link">
                  View all
                </Link>
              </div>
              <ul className="compact-list">
                {loans.map((r) => (
                  <li key={r.id}>
                    <Link to="/student/borrowed" className="compact-row">
                      <span className="compact-main">
                        <strong>{r.book_title}</strong>
                        <span className="muted">Due {formatDate(r.due_date)}</span>
                      </span>
                      <span className={`compact-meta${isOverdue(r) ? ' is-danger' : ''}`}>{dueText(r)}</span>
                    </Link>
                  </li>
                ))}
                {!loading && loans.length === 0 && <li className="compact-empty">No books on loan.</li>}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Awaiting pickup</h2>
                <Link to="/student/reservations" className="panel-link">
                  View all
                </Link>
              </div>
              <ul className="compact-list">
                {pickups.map((r) => (
                  <li key={r.id}>
                    <Link to="/student/reservations" className="compact-row">
                      <span className="compact-main">
                        <strong>{r.book_title}</strong>
                        <span className="muted">
                          Ref No. {r.reference_no} · {pickupText(r)}
                        </span>
                      </span>
                      <StatusBadge record={r} />
                    </Link>
                  </li>
                ))}
                {!loading && pickups.length === 0 && (
                  <li className="compact-empty">
                    Nothing to pick up. <Link to="/student/catalog" className="panel-link">Find a book</Link>
                  </li>
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
