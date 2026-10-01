import { useSearchParams } from 'react-router-dom';

// A piece of UI state (active tab, search text) kept in the URL query string,
// so notification links like /staff/borrowed?tab=overdue land on the right
// view and the back button works.
export default function useUrlParam(name, defaultValue, allowed) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(name);
  const value = raw !== null && (!allowed || allowed.includes(raw)) ? raw : defaultValue;

  function setValue(next) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (!next || next === defaultValue) params.delete(name);
        else params.set(name, next);
        return params;
      },
      { replace: true }
    );
  }

  return [value, setValue];
}
