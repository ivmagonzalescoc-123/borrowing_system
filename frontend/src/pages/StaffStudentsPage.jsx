import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, UserPlus } from 'lucide-react';
import api from '../api/axios';
import AddStaffModal from '../components/AddStaffModal';
import RecordListSkeleton from '../components/RecordListSkeleton';
import SearchField from '../components/SearchField';
import StudentRecordsModal from '../components/StudentRecordsModal';
import { EmptyState, ErrorState } from '../components/DataState';
import { useToast } from '../context/ToastContext';
import useAllBorrows from '../hooks/useAllBorrows';
import useUrlParam from '../hooks/useUrlParam';

export default function StaffStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useUrlParam('q', '');
  const [activeOnly, setActiveOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const { records } = useAllBorrows();
  const { showSuccess } = useToast();

  const loadStudents = useCallback(async () => {
    try {
      const res = await api.get('/users/students');
      setStudents(res.data.students);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const q = query.trim().toLowerCase();
  const shown = students
    .filter((s) => !activeOnly || s.reserved_count + s.borrowed_count > 0)
    .filter(
      (s) =>
        !q ||
        [s.full_name, s.id_number, s.email, s.course].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
    // Students with overdue books first, then anyone with something out.
    .sort(
      (a, b) =>
        b.overdue_count - a.overdue_count ||
        b.reserved_count + b.borrowed_count - (a.reserved_count + a.borrowed_count) ||
        a.full_name.localeCompare(b.full_name)
    );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p className="page-subtitle">Look up what a student currently has reserved or on loan.</p>
        </div>
        <button type="button" className="btn-primary btn-yellow" onClick={() => setShowAddStaff(true)}>
          <UserPlus size={16} strokeWidth={1.75} />
          Add Staff Account
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-row">
          <SearchField value={query} onChange={setQuery} placeholder="Search by name, ID number, email, or course" />
          <label className="toggle-label">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
            With books out
          </label>
        </div>
      </div>

      <div className="record-list">
        {loading ? (
          <RecordListSkeleton />
        ) : loadError ? (
          <ErrorState onRetry={loadStudents} />
        ) : (
          <>
            {shown.map((s) => (
              <button key={s.id} type="button" className="student-row" onClick={() => setSelected(s)}>
                <span className="student-avatar">{s.full_name.charAt(0).toUpperCase()}</span>
                <span className="compact-main">
                  <strong>{s.full_name}</strong>
                  <span className="muted">
                    {s.id_number}
                    {s.course && ` · ${s.course}`}
                  </span>
                </span>
                <span className="student-counts">
                  {s.overdue_count > 0 && <span className="count-pill is-danger">{s.overdue_count} overdue</span>}
                  {s.borrowed_count > 0 && <span className="count-pill">{s.borrowed_count} on loan</span>}
                  {s.reserved_count > 0 && <span className="count-pill is-warning">{s.reserved_count} reserved</span>}
                  {s.reserved_count + s.borrowed_count === 0 && <span className="muted">Nothing out</span>}
                </span>
                <ChevronRight size={16} strokeWidth={1.75} className="muted" />
              </button>
            ))}
            {shown.length === 0 && <EmptyState message={q ? `No students match “${query}”.` : 'No students found.'} />}
          </>
        )}
      </div>

      {selected && <StudentRecordsModal student={selected} records={records} onClose={() => setSelected(null)} />}

      {showAddStaff && (
        <AddStaffModal
          onClose={() => setShowAddStaff(false)}
          onCreated={(staff) => {
            setShowAddStaff(false);
            showSuccess(`Staff account created for ${staff.full_name}`);
          }}
        />
      )}
    </div>
  );
}
