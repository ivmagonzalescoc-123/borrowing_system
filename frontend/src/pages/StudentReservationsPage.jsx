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
import { CLOSED_RESERVATION_STATUSES } from '../utils/records';
import PageHelp from '../components/PageHelp';

export default function StudentReservationsPage() {
  const { records, loading, loadError, reload } = useMyBorrows();
  const [tab, setTab] = useUrlParam('tab', 'pending', ['pending', 'history']);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { showSuccess, showError } = useToast();

  const pending = records
    .filter((r) => r.status === 'reserved')
    .sort((a, b) => String(a.pickup_deadline).localeCompare(String(b.pickup_deadline)));
  const history = records.filter((r) => CLOSED_RESERVATION_STATUSES.includes(r.status));
  const shown = tab === 'pending' ? pending : history;

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.patch(`/borrows/${cancelTarget.id}/cancel`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showSuccess('Reservation cancelled');
      setCancelTarget(null);
      reload();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Reservations</h1>
            <PageHelp>
              <p>Show the reference number at the library desk to pick up your book.</p>
              <ul>
                <li>Pick it up by the date shown, or the reservation expires and the copy goes to the next student.</li>
                <li>Changed your mind? Tap <strong>Cancel</strong> so someone else can borrow it.</li>
                <li>The <strong>Past</strong> tab lists cancelled, declined, and expired reservations.</li>
              </ul>
            </PageHelp>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          label="Reservations"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: 'Awaiting pickup', count: pending.length },
            { value: 'history', label: 'Past', count: history.length },
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
                  record.status === 'reserved' && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setCancelTarget(record)}>
                      Cancel
                    </button>
                  )
                }
              />
            ))}
            {shown.length === 0 &&
              (tab === 'pending' ? (
                <EmptyState
                  message="You have no reservations waiting for pickup."
                  action={
                    <Link to="/student/catalog" className="btn-primary">
                      <Library size={16} strokeWidth={1.75} />
                      Browse the catalog
                    </Link>
                  }
                />
              ) : (
                <EmptyState message="No cancelled, declined, or expired reservations." />
              ))}
          </>
        )}
      </div>

      {cancelTarget && (
        <ConfirmModal
          title="Cancel this reservation?"
          message="The copy goes back on the shelf for other students. This cannot be undone."
          details={[
            ['Book', cancelTarget.book_title],
            ['Ref No.', cancelTarget.reference_no],
          ]}
          confirmLabel="Cancel reservation"
          cancelLabel="Keep it"
          danger
          submitting={cancelling}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
