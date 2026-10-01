import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SearchField from './SearchField';
import { SORT_OPTIONS } from '../utils/catalog';

export default function BookSearchBar({ query, onQueryChange, category, onCategoryChange, categories, sort, onSortChange }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const ref = useRef(null);
  const filtersActive = Boolean(category) || (sort && sort !== 'title');

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setFilterOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="search-bar-row">
      <SearchField value={query} onChange={onQueryChange} placeholder="Search by title, author, or ISBN" />
      <div className="dropdown-wrapper" ref={ref}>
        <button
          className={`icon-button filter-button${filtersActive ? ' is-active' : ''}`}
          onClick={() => setFilterOpen((o) => !o)}
          aria-label="Filter and sort"
          aria-expanded={filterOpen}
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
        </button>
        {filterOpen && (
          <div className="dropdown-panel filter-panel">
            <label>
              Category
              <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {onSortChange && (
              <label>
                Sort by
                <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {filtersActive && (
              <button
                type="button"
                className="btn-ghost filter-reset"
                onClick={() => {
                  onCategoryChange('');
                  onSortChange?.('title');
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
