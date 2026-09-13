function SkeletonCard() {
  return (
    <div className="catalog-card is-skeleton" aria-hidden="true">
      <div className="catalog-card-cover skeleton-block" />
      <div className="catalog-card-body">
        <span className="skeleton-block skeleton-tag" />
        <span className="skeleton-block skeleton-title" />
        <span className="skeleton-block skeleton-author" />
        <span className="skeleton-block skeleton-avail" />
      </div>
    </div>
  );
}

// Placeholder cards shown in place of the catalog grid while it's loading,
// so a slow connection reads as "still loading" instead of "no books".
export default function CatalogSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
