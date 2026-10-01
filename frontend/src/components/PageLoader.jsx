import SparkleSpinner from './SparkleSpinner';

export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <SparkleSpinner size={28} />
    </div>
  );
}
