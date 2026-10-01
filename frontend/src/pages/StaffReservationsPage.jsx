import { useState } from 'react';
import api from '../api/axios';
import { formatDate } from '../utils/dateFormat';
import BorrowRecordRow from '../components/BorrowRecordRow';
import HandoverModal from '../components/HandoverModal';
import ReasonModal from '../components/ReasonModal';
import StudentRecordsModal from '../components/StudentRecordsModal';
import RecordListSkeleton from '../components/RecordListSkeleton';
import SearchField from '../components/SearchField';
import { EmptyState, ErrorState } from '../components/DataState';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import useAllBorrows from '../hooks/useAllBorrows';
import useUrlParam from '../hooks/useUrlParam';
import { matchesRecordQuery, todayString } from '../utils/records';
import PageHelp from '../components/PageHelp';

function studentOf(record) {
  return {
    id: record.student_id,
    full_name: record.student_name,
    id_number: record.student_id_number,
    course: record.student_course,
  };
}

export default function StaffReservationsPage() {
  const { records, policy, loading, loadError, reload } = useAllBorrows();
  const [query, setQuery] = useUrlParam('q', '');
  const [handoverTarget, setHandoverTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [studentTarget, setStudentTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  async function handleConfirmHandover({ dueDate }) {
    const ok = await confirm({
      title: 'Hand over this book?',
      message: 'The student takes the book home now. They will be reminded before it is due.',
      details: [
        ['Book', handoverTarget.book_title],
        ['Student', `${handoverTarget.student_name} (${handoverTarget.student_id_number})`],
        ['Due date', formatDate(dueDate)],
      ],
      confirmLabel: 'Hand over',
    });
    if (!ok) return;
    setSubmitting(true);
    setFormError('');
    try {
      await api.patch(
        `/borrows/${handoverTarget.id}/handover`,
        { dueDate },
        { headers: { 'Idempotency-Key': crypto.randomUUID() } }
      );
      showSuccess('Book handed over successfully');
      setHandoverTarget(null);
      reload();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to hand over book';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(reason) {
    const ok = await confirm({
      title: 'Decline this reservation?',
      message: 'The copy goes back on the shelf and the student is notified with your reason. This cannot be undone.',
      details: [
        ['Book', rejectTarget.book_title],
        ['Student', rejectTarget.student_name],
        ['Reason', reason],
      ],
      confirmLabel: 'Decline',
      tone: 'danger',
    });
    if (!ok) return;
    setSubmitting(true);
    setFormError('');
    try {
      await api.patch(`/borrows/${rejectTarget.id}/reject`, { reason }, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showSuccess('Reservation declined — the student has been notified');
      setRejectTarget(null);
      reload();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to decline reservation';
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Soonest pickup deadline first, so reservations about to expire are on top.
  const reservations = records
    .filter((r) => r.status === 'reserved')
    .sort((a, b) => String(a.pickup_deadline).localeCompare(String(b.pickup_deadline)));
  const shown = reservations.filter((r) => matchesRecordQuery(r, query));
  const today = todayString();
  const pickupToday = reservations.filter((r) => r.pickup_deadline?.slice(0, 10) === today).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title-row">
            <h1>Reservations</h1>
            <PageHelp>
              <ul>
                <li>When a student arrives, search their reference number.</li>
                <li>
                  <strong>Hand Over</strong>: confirm the reference number and due date to lend the book.
                </li>
                <li><strong>Decline</strong> with a reason if the book can&apos;t be lent. The student is notified.</li>
                <li>Reservations not picked up by their deadline expire automatically.</li>
              </ul>
            </PageHelp>
          </div>
          <p className="page-subtitle">
            {reservations.length} awaiting pickup
            {pickupToday > 0 && ` · ${pickupToday} must be picked up today`}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search by reference no., student, ID number, or book" />
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
                showStudent
                onStudentClick={(r) => setStudentTarget(studentOf(r))}
                action={
                  <div className="record-action-buttons">
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setFormError('');
                        setRejectTarget(record);
                      }}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => {
                        setFormError('');
                        setHandoverTarget(record);
                      }}
                    >
                      Hand Over
                    </button>
                  </div>
                }
              />
            ))}
            {shown.length === 0 && (
              <EmptyState message={query ? `No reservations match “${query}”.` : 'No pending reservations.'} />
            )}
          </>
        )}
      </div>

      {handoverTarget && (
        <HandoverModal
          record={handoverTarget}
          policy={policy}
          submitting={submitting}
          error={formError}
          onClose={() => setHandoverTarget(null)}
          onConfirm={handleConfirmHandover}
        />
      )}

      {rejectTarget && (
        <ReasonModal
          title="Decline reservation"
          subtitle={`"${rejectTarget.book_title}" for ${rejectTarget.student_name}`}
          confirmLabel="Decline"
          submitting={submitting}
          error={formError}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {studentTarget && (
        <StudentRecordsModal student={studentTarget} records={records} onClose={() => setStudentTarget(null)} />
      )}
    </div>
  );
}
