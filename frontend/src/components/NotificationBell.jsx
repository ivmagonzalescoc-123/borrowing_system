import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(String(iso).replace(' ', 'T')).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  // Which items were unread when the panel opened, so they stay highlighted
  // even though opening the panel marks everything read.
  const [freshIds, setFreshIds] = useState(() => new Set());
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function toggle() {
    if (!open) {
      setFreshIds(new Set(notifications.filter((n) => !n.is_read).map((n) => n.id)));
      if (unreadCount > 0) markAllRead();
    }
    setOpen((o) => !o);
  }

  function openNotification(n) {
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <button
        className="icon-button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && <span className="badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="dropdown-panel notification-panel">
          {notifications.length === 0 ? (
            <p className="dropdown-empty">No notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const className = `notification-item${freshIds.has(n.id) ? ' is-unread' : ''}${n.link ? ' is-link' : ''}`;
              const body = (
                <>
                  <p>{n.message}</p>
                  <span>
                    {timeAgo(n.created_at)}
                    {n.link && <ChevronRight size={12} strokeWidth={2} aria-hidden="true" />}
                  </span>
                </>
              );
              return n.link ? (
                <button key={n.id} type="button" className={className} onClick={() => openNotification(n)}>
                  {body}
                </button>
              ) : (
                <div key={n.id} className={className}>
                  {body}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
