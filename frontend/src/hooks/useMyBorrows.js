import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { isOverdue } from '../utils/records';

// The signed-in student's borrow records plus the library policy, with the
// derived numbers the UI needs (active items, overdue, next due date).
export default function useMyBorrows() {
  const [records, setRecords] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await api.get('/borrows/mine');
      setRecords(res.data.records);
      setPolicy(res.data.policy);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const summary = useMemo(() => {
    const reservations = records.filter((r) => r.status === 'reserved');
    const loans = records.filter((r) => r.status === 'borrowed');
    const overdue = loans.filter(isOverdue);
    const nextDue = [...loans].sort((a, b) => a.due_date.localeCompare(b.due_date))[0] || null;
    return { reservations, loans, overdue, nextDue, activeCount: reservations.length + loans.length };
  }, [records]);

  // Why this student can't reserve `book` right now (null if they can). The
  // server enforces the same rules; this just explains them up front.
  const blockerFor = useCallback(
    (book) => {
      if (!book) return null;
      if (summary.overdue.length > 0) {
        return 'You have an overdue book. Return it to the library desk before reserving another.';
      }
      const existing = records.find((r) => r.book_id === book.id && (r.status === 'reserved' || r.status === 'borrowed'));
      if (existing) {
        return existing.status === 'reserved'
          ? `You already reserved this book (Ref No. ${existing.reference_no}).`
          : 'You currently have this book on loan.';
      }
      if (policy && summary.activeCount >= policy.maxActiveItems) {
        return `You've reached the limit of ${policy.maxActiveItems} reservations or loans at a time. Return or cancel one first.`;
      }
      return null;
    },
    [records, summary, policy]
  );

  return { records, policy, loading, loadError, reload, summary, blockerFor };
}
