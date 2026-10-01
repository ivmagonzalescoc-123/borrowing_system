import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

// Every borrow record (staff only) plus the library policy.
export default function useAllBorrows() {
  const [records, setRecords] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await api.get('/borrows');
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

  return { records, policy, loading, loadError, reload };
}
