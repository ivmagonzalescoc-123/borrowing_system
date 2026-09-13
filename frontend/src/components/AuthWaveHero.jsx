import { Sparkle } from 'lucide-react';

export default function AuthWaveHero() {
  return (
    <>
      <img
        className="auth-hero-watermark"
        src="/assets/img/phinma-coc.png"
        alt=""
        aria-hidden="true"
      />
      <Sparkle className="auth-hero-sparkle" aria-hidden="true" />
      <div className="auth-hero">
        <div className="auth-hero-brand">
          <span className="auth-hero-title">
            Phinma Cagayan de Oro College
            {/* Mobile/tablet-portrait: sits inline right after the text. */}
            <img
              className="auth-hero-logo auth-hero-logo-inline"
              src="/assets/img/no-bg-logo.png"
              alt=""
              aria-hidden="true"
            />
          </span>
          <span className="auth-hero-subtitle">Library Borrowing System</span>
        </div>
        <svg
          className="auth-hero-wave"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,750 C 240,563 480,447 720,400 C 960,353 1200,237 1440,50 L1440,800 L0,800 Z" />
        </svg>
      </div>
      {/* Desktop/landscape-tablet: a bigger badge, positioned to sit behind the
          login card so it never gets clipped by .auth-hero's own bounds and
          never covers the form. */}
      <img
        className="auth-hero-logo auth-hero-logo-desktop"
        src="/assets/img/no-bg-logo.png"
        alt=""
        aria-hidden="true"
      />
      <div className="auth-hero-green-bottom">
        <svg
          className="auth-hero-green-bottom-wave"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,750 C 240,563 480,447 720,400 C 960,353 1200,237 1440,50 L1440,0 L0,0 Z" />
        </svg>
      </div>
      <div className="auth-hero-yellow-trim">
        <svg
          className="auth-hero-yellow-trim-wave"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="authHeroYellowTrim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffdd33" />
              <stop offset="100%" stopColor="#ffb800" />
            </linearGradient>
          </defs>
          <path
            d="M0,710 C 240,523 480,407 720,360 C 960,313 1200,197 1440,10 L1440,90 C 1200,277 960,393 720,440 C 480,487 240,603 0,790 Z"
            fill="url(#authHeroYellowTrim)"
          />
        </svg>
      </div>
    </>
  );
}
