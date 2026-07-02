import { buildCancelNoticeContent } from '../../utils/bookingDisplay';

export default function BookingCancelNotice({ refundInfo }) {
  const content = buildCancelNoticeContent(refundInfo);
  if (!content?.summaryText) return null;

  return (
    <div className="booking-cancel-notice">
      <p className="booking-cancel-notice-body">{content.summaryText}</p>
    </div>
  );
}
