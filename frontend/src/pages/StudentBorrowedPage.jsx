import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';
import RecordListSkeleton from '../components/RecordListSkeleton';
import ConfirmModal from '../components/ConfirmModal';
import Tabs from '../components/Tabs';
import { EmptyState, ErrorState } from '../components/DataState';
import { useToast } from '../context/ToastContext';
import useMyBorrows from '../hooks/useMyBorrows';
import useUrlParam from '../hooks/useUrlParam';
import { addDays, isOverdue } from '../utils/records';
import { formatDate } from '../utils/dateFormat';

export default function StudentBorrowedPage() {
  const { records, policy, loading, loadError, reload } = useMyBorrows();
  const [tab, setTab] = useUrlParam('tab', 'current', ['current', 'history']);
  const [renewTarget, setRenewTarget] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const { showSuccess, showError } = useToast();

  // Overdue first, then soonest due.
  const current = records
    .filter((r) => r.status === 'borrowed')
    .sort((a, b) => isOverdue(b) - isOverdue(a) || a.due_date.localeCompare(b.due_date));
  const history = records.filter((r) => r.status === 'returned');
  const shown = tab === 'current' ? current : history;

  function canRenew(record) {
    return policy && !isOverdue(record) && record.renewal_count < policy.maxRenewals;
  }

  async function handleRenew() {
    setRenewing(true);
    try {
      const res = await api.patch(`/borrows/${renewTarget.id}/renew`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showSuccess(`Renewed — now due ${formatDate(res.data.record.due_date)}`);
      setRenewTarget(null);
      reload();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to renew');
    } finally {
      setRenewing(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Borrowed Books</h1>
          <p className="page-subtitle">Return books to the library desk on or before their due date.</p>
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          label="Borrowed books"
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: 'current',
              label: 'On loan',
              count: current.length,
              tone: current.some(isOverdue) ? 'danger' : undefined,
            },
            { value: 'history', label: 'History', count: history.length },
          ]}
        />
      </div>

      <div className="record-list">
        {loading ? (
          <RecordListSkeleton />
        ) : loadError ? (
          <ErrorState onRetry={reload} />
        ) : (
          <>
            {shown.map((record) => (
              <BorrowRecordRow
                key={record.id}
                record={record}
                action={
                  record.status === 'borrowed' &&
                  canRenew(record) && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setRenewTarget(record)}>
                      Renew {policy.renewalDays} days
                    </button>
                  )
                }
              />
            ))}
            {shown.length === 0 && (
              <EmptyState
                message={tab === 'current' ? "You don't have any books on loan right now." : 'No returned books yet.'}
                action={
                  tab === 'current' && (
                    <Link to="/student/catalog" className="btn-primary">
                      <Library size={16} strokeWidth={1.75} />
                      Browse the catalog
                    </Link>
                  )
                }
              />
            )}
          </>
        )}
      </div>

      {renewTarget && (
        <ConfirmModal
          title="Renew this loan?"
          message={`"${renewTarget.book_title}" will be due ${formatDate(
            addDays(renewTarget.due_date.slice(0, 10), policy.renewalDays)
          )} instead of ${formatDate(renewTarget.due_date)}. Each loan can be renewed ${
            policy.maxRenewals === 1 ? 'once' : `${policy.maxRenewals} times`
          }.`}
          confirmLabel="Renew"
          submitting={renewing}
          onConfirm={handleRenew}
          onClose={() => setRenewTarget(null)}
        />
      )}
    </div>
  );
}
