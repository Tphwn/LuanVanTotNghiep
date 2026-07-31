const pad2 = (n) => String(n).padStart(2, '0');

/** HH:mm dd/MM/yyyy (không giây) */
export const formatNotifyDateTime = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/**
 * Thời gian thân thiện cho thông báo:
 * < 1 phút → Vừa xong
 * < 60 phút → X phút trước
 * < 24 giờ → X giờ trước
 * ≥ 24 giờ → HH:mm dd/MM/yyyy
 */
export const formatRelativeTime = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return formatNotifyDateTime(d);

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Vừa xong';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  return formatNotifyDateTime(d);
};
