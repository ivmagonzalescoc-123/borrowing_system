import { Clock, BookOpen, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { statusMeta } from '../utils/records';

const TONE_ICONS = {
  reserved: Clock,
  borrowed: BookOpen,
  overdue: AlertCircle,
  returned: CheckCircle2,
  closed: XCircle,
};

export default function StatusBadge({ record }) {
  const { label, tone } = statusMeta(record);
  const Icon = TONE_ICONS[tone];
  return (
    <span className={`status-badge status-${tone}`}>
      {Icon && <Icon size={12} strokeWidth={2} aria-hidden="true" />}
      {label}
    </span>
  );
}
