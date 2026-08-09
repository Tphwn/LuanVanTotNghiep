import { Loader2 } from 'lucide-react';

export default function CustomerLoadingState({
  message = 'Đang tải dữ liệu...',
  className = '',
  compact = false,
}) {
  return (
    <div
      className={[
        'customer-loading-state',
        compact ? 'customer-loading-state--compact' : '',
        className,
      ].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="customer-loading-state__spinner" size={compact ? 22 : 28} strokeWidth={2.25} aria-hidden />
      <p className="customer-loading-state__text">{message}</p>
    </div>
  );
}
