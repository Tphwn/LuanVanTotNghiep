import { buildCancelNoticeContent, getBookingCancelReason } from '../../utils/bookingDisplay';

export default function BookingCancelNotice({ refundInfo, booking }) {
  const cancelReason = getBookingCancelReason(booking) || refundInfo?.ly_do_huy;
  const content = buildCancelNoticeContent(refundInfo);
  if (!cancelReason && !content?.summaryText) return null;

  return (
    <div className="booking-cancel-notice">
      {cancelReason && (
        <p className="booking-cancel-notice-reason">
          <strong>Lý do hủy:</strong> {cancelReason}
        </p>
      )}
      {content?.summaryText && (
        <p className="booking-cancel-notice-body">{content.summaryText}</p>
      )}
    </div>
  );
}
