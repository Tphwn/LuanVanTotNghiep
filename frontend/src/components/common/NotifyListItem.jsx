import { formatNotifyDateTime, formatRelativeTime } from '../../utils/formatRelativeTime';

export default function NotifyListItem({
  item,
  meta,
  expanded,
  onToggleDetail,
  onOpenRelated,
}) {
  const unread = !item.da_doc;
  const Icon = meta.Icon;
  const hasContent = Boolean(String(item.noi_dung || '').trim());
  const canOpenRelated = Boolean(meta.path) && typeof onOpenRelated === 'function';

  return (
    <div className={`partner-notify-item${unread ? ' is-unread' : ''}${expanded ? ' is-expanded' : ''}`}>
      <span className={`partner-notify-icon partner-notify-icon--${meta.kind}`} aria-hidden>
        <Icon size={14} strokeWidth={2.4} />
      </span>

      <div className="partner-notify-item-main">
        <div className="partner-notify-item-title-row">
          <div className="partner-notify-item-title">
            {item.tieu_de}
            {meta.badge && (
              <span className="partner-notify-type">{meta.badge}</span>
            )}
          </div>
          {unread && <span className="partner-notify-unread-dot" aria-label="Chưa đọc" />}
        </div>

        {expanded && hasContent && (
          <div
            className={`partner-notify-item-content${canOpenRelated ? ' is-clickable' : ''}`}
            onClick={canOpenRelated ? () => onOpenRelated(item) : undefined}
            onKeyDown={canOpenRelated ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenRelated(item);
              }
            } : undefined}
            role={canOpenRelated ? 'button' : undefined}
            tabIndex={canOpenRelated ? 0 : undefined}
          >
            {item.noi_dung}
          </div>
        )}

        <div className="partner-notify-item-meta">
          {hasContent && (
            <button
              type="button"
              className="partner-notify-detail-btn"
              onClick={() => onToggleDetail(item)}
            >
              {expanded ? 'Thu gọn' : 'Xem chi tiết'}
            </button>
          )}
          <div className="partner-notify-item-time" title={formatNotifyDateTime(item.ngay_gui)}>
            {formatRelativeTime(item.ngay_gui)}
          </div>
        </div>
      </div>
    </div>
  );
}
