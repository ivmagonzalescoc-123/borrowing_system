function SkeletonRow() {
  return (
    <div className="record-row is-skeleton" aria-hidden="true">
      <div className="record-cover skeleton-block" />
      <div className="record-info">
        <span className="skeleton-block skeleton-record-title" />
        <span className="skeleton-block skeleton-record-line" />
        <span className="skeleton-block skeleton-record-line is-short" />
      </div>
      <div className="record-actions">
        <span className="skeleton-block skeleton-badge" />
      </div>
    </div>
  );
}

// Placeholder rows shown in place of the reservation/borrowed list while
// it's loading, so a slow connection reads as "still loading" instead of
// "you have none of these".
export default function RecordListSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </>
  );
}
