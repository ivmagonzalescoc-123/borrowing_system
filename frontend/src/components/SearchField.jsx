import { Search, X } from 'lucide-react';

export default function SearchField({ value, onChange, placeholder, autoFocus }) {
  return (
    <div className="search-input-wrapper">
      <Search size={16} strokeWidth={1.75} aria-hidden="true" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
