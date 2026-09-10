import { BookMarked } from 'lucide-react';

export default function AuthWaveHero() {
  return (
    <div className="auth-hero">
      <div className="auth-hero-brand">
        <BookMarked size={24} strokeWidth={1.75} />
        <span>COC Library</span>
      </div>
      <svg
        className="auth-hero-wave"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,60 C 240,25 480,25 720,60 C 960,95 1200,95 1440,60 L1440,110 L0,110 Z" />
      </svg>
    </div>
  );
}
