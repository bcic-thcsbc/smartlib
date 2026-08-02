export function PageLoader() {
  return (
    <div className="skeleton-page" role="status" aria-label="Loading content">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-copy" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
