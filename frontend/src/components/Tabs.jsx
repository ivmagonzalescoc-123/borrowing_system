// Segmented tab strip. `tabs` is [{ value, label, count?, tone? }].
export default function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`tab${value === tab.value ? ' is-active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`tab-count${tab.tone ? ` is-${tab.tone}` : ''}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
