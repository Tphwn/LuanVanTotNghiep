// thông báo đánh giá của admin 
const ReviewModerationNotice = ({
  variant = 'hidden',
  title,
  reasonLabel = 'Lý do',
  reason,
  note,
}) => {
  if (!title && !reason && !note) return null;

  return (
    <section className={`review-moderation-notice review-moderation-notice--${variant}`}>
      {title && <h4 className="review-moderation-notice-title">{title}</h4>}
      {reason && (
        <p className="review-moderation-notice-reason">
          <strong>{reasonLabel}:</strong>
          {' '}
          {reason}
        </p>
      )}
      {note && (
        <div className="review-moderation-notice-note">
          <span className="review-moderation-notice-note-label">Ghi chú</span>
          <p>{note}</p>
        </div>
      )}
    </section>
  );
};

export default ReviewModerationNotice;
