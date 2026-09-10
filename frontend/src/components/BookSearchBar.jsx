import { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function BookSearchBar({ query, onQueryChange, category, onCategoryChange, categories }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-bar-row">
      <div className="search-input-wrapper">
        <Search size={16} strokeWidth={1.75} />
        <input
          placeholder="Search by title, author, or ISBN"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="dropdown-wrapper" ref={ref}>
        <button className="icon-button filter-button" onClick={() => setFilterOpen((o) => !o)} aria-label="Filter">
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
          </div>
        )}
      </div>
    </div>
  );
}
