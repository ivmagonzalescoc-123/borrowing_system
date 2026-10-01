import { useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api/axios';
import BorrowRecordRow from '../components/BorrowRecordRow';
import SparkleSpinner from '../components/SparkleSpinner';
import RecordListSkeleton from '../components/RecordListSkeleton';
import SearchField from '../components/SearchField';
import StudentRecordsModal from '../components/StudentRecordsModal';
import Tabs from '../components/Tabs';
import { EmptyState, ErrorState } from '../components/DataState';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import useAllBorrows from '../hooks/useAllBorrows';
import useUrlParam from '../hooks/useUrlParam';
import { downloadCsv } from '../utils/csv';
import { daysBetween, isOverdue, matchesRecordQuery, statusMeta, todayString } from '../utils/records';

const TABS = ['active', 'overdue', 'returned'];

const CSV_COLUMNS = [
  { label: 'Reference No.', value: (r) => r.reference_no },
  { label: 'Book', value: (r) => r.book_title },
  { label: 'ISBN', value: (r) => r.book_isbn },
  { label: 'Student', value: (r) => r.student_name },
  { label: 'Student ID', value: (r) => r.student_id_number },
  { label: 'Course', value: (r) => r.student_course },
  { label: 'Status', value: (r) => statusMeta(r).label },
  { label: 'Borrowed', value: (r) => r.borrowed_at?.slice(0, 10) },
  { label: 'Due', value: (r) => r.due_date?.slice(0, 10) },
  { label: 'Returned', value: (r) => r.returned_at?.slice(0, 10) },
  { label: 'Days overdue', value: (r) => (isOverdue(r) ? daysBetween(r.due_date, todayString()) : '') },
  { label: 'Renewals', value: (r) => r.renewal_count },
  { label: 'Purpose', value: (r) => r.purpose },
];

function studentOf(record) {
  return {
    id: record.student_id,
    full_name: record.student_name,
    id_number: record.student_id_number,
    course: record.student_course,
  };
}

export default function StaffBorrowedPage() {
  const { records, loading, loadError, reload } = useAllBorrows();
  const [tab, setTab] = useUrlParam('tab', 'active', TABS);
  const [query, setQuery] = useUrlParam('q', '');
  const [returningId, setReturningId] = useState(null);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [studentTarget, setStudentTarget] = useState(null);
  const { showSuccess, showError } = useToast();

  async function handleMarkReturned(id) {
    setReturningId(id);
    try {
      await api.patch(`/borrows/${id}/return`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showSuccess('Book marked as returned');
      reload();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to mark book as returned');
    } finally {
      setReturningId(null);
      setConfirmRecord(null);
    }
  }

  // Overdue first (most overdue on top), then soonest due.
  const active = records
    .filter((r) => r.status === 'borrowed')
    .sort((a, b) => isOverdue(b) - isOverdue(a) || a.due_date.localeCompare(b.due_date));
  const overdue = active.filter(isOverdue);
  const returned = records
    .filter((r) => r.status === 'returned')
    .sort((a, b) => String(b.returned_at).localeCompare(String(a.returned_at)));
  const byTab = { active, overdue, returned };
  const shown = byTab[tab].filter((r) => matchesRecordQuery(r, query));

  function handleExport() {
    downloadCsv(`borrowed-${tab}-${todayString()}.csv`, CSV_COLUMNS, shown);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Borrowed Books</h1>
          <p className="page-subtitle">
            {active.length} on loan{overdue.length > 0 && ` · ${overdue.length} overdue`}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <Tabs
          label="Borrowed books"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'active', label: 'On loan', count: active.length },
            { value: 'overdue', label: 'Overdue', count: overdue.length, tone: overdue.length ? 'danger' : undefined },
            { value: 'returned', label: 'Returned', count: returned.length },
          ]}
        />
        <div className="toolbar-row">
          <SearchField value={query} onChange={setQuery} placeholder="Search by reference no., student, ID number, or book" />
          <button type="button" className="btn-ghost" onClick={handleExport} disabled={shown.length === 0}>
            <Download size={16} strokeWidth={1.75} />
            Export CSV
          </button>
        </div>
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
                  record.status === 'borrowed' && (
                    <button
                      className={`btn-primary btn-sm${returningId === record.id ? ' is-loading' : ''}`}
                      disabled={returningId === record.id}
                      onClick={() => setConfirmRecord(record)}
                    >
                      {returningId === record.id ? (
                        <>
                          <SparkleSpinner size={16} />
                          Returning…
                        </>
                      ) : (
                        'Mark Returned'
                      )}
                    </button>
                  )
                }
              />
            ))}
            {shown.length === 0 && (
              <EmptyState
                message={
                  query
                    ? `No records match “${query}”.`
                    : { active: 'No books are on loan.', overdue: 'Nothing is overdue.', returned: 'No returned books yet.' }[tab]
                }
              />
            )}
          </>
        )}
      </div>

      {confirmRecord && (
        <ConfirmModal
          title="Mark Book as Returned?"
          message={`Confirm that "${confirmRecord.book_title}" borrowed by ${confirmRecord.student_name} has been returned. This cannot be undone.`}
          confirmLabel="Mark Returned"
          submitting={returningId === confirmRecord.id}
          onConfirm={() => handleMarkReturned(confirmRecord.id)}
          onClose={() => setConfirmRecord(null)}
        />
      )}

      {studentTarget && (
        <StudentRecordsModal student={studentTarget} records={records} onClose={() => setStudentTarget(null)} />
      )}
    </div>
  );
}
