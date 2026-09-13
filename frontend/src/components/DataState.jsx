import { Inbox, WifiOff } from 'lucide-react';

// Shown once loading finishes and the list came back empty — distinct from
// ErrorState below so "there's genuinely nothing here" never looks the same
// as "this failed to load".
export function EmptyState({ message }) {
  return (
    <div className="state-message">
      <Inbox size={26} strokeWidth={1.5} />
      <p>{message}</p>
    </div>
  );
}

// Shown when the request itself failed (e.g. no internet, API down) instead
// of silently rendering an empty list.
export function ErrorState({ message = "Couldn't load this. Check your connection and try again.", onRetry }) {
  return (
    <div className="state-message is-error">
      <WifiOff size={26} strokeWidth={1.5} />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-ghost state-retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
