import { Sparkle } from 'lucide-react';

export default function SparkleSpinner({ size = 18, className = '' }) {
  return (
    <span
      className={`sparkle-spinner ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Sparkle className="sparkle-spinner-main" style={{ width: size, height: size }} />
      <Sparkle
        className="sparkle-spinner-mini sparkle-spinner-mini-a"
        style={{ width: size * 0.42, height: size * 0.42 }}
      />
      <Sparkle
        className="sparkle-spinner-mini sparkle-spinner-mini-b"
        style={{ width: size * 0.3, height: size * 0.3 }}
      />
    </span>
  );
}
