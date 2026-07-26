import { Eye, X } from 'lucide-react';
import ActionButton, { ActionCell } from '../common/ActionButton';
import {
  TRANG_THAI,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
} from '../../utils/bookingDisplay';

const CANCEL_BLOCKED_STATUS = ['hoan_thanh', 'da_huy', 'tu_choi', 'da_checkin'];

const toDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function BookingTable({
  bookings,
  onViewDetail,
  onCancelBooking,
  highlightToday = false,
  todayKey = '',
  showRoomType = true,
}) {
  return (
    <tbody>
      {bookings.map((b) => {
        const hotel = b.loai_phong?.khach_san;
        const stBadge = TRANG_THAI[b.trang_thai] || {
          label: b.trang_thai,
          cls: 'badge-default',
        };
        const pay = getPaymentDisplay(b);
        const customerName = b.khach_hang?.ho_ten || b.ten_nguoi_nhan || '—';
        const phone = b.sdt_nguoi_nhan || b.khach_hang?.sdt || '';
        const checkInKey = toDateKey(b.ngay_nhan_phong);
        const checkOutKey = toDateKey(b.ngay_tra_phong);
        const isCheckInToday = Boolean(highlightToday && todayKey && checkInKey === todayKey);
        const isCheckOutToday = Boolean(highlightToday && todayKey && checkOutKey === todayKey);
        const rowClass = [
          isCheckInToday ? 'booking-row--checkin-today' : '',
          isCheckOutToday && !isCheckInToday ? 'booking-row--checkout-today' : '',
        ].filter(Boolean).join(' ');

        return (
          <tr key={b.ma_dat_phong} className={rowClass || undefined}>
            <td className="mgmt-table-cell-code partner-col-code">
              <span className="mgmt-cell-code" title={b.ma_don_hang}>{b.ma_don_hang}</span>
            </td>
            <td className="partner-col-customer">
              <div className="booking-customer-cell">
                <div className="admin-cell-name">{customerName}</div>
                {phone ? (
                  <div className="booking-customer-phone">{phone}</div>
                ) : null}
              </div>
            </td>
            <td className="partner-col-hotel">
              <div className="admin-cell-name">{hotel?.ten || '—'}</div>
            </td>
            {showRoomType && (
              <td className="partner-col-room">
                <div className="mgmt-cell-sub">{b.loai_phong?.ten_loai || '—'}</div>
              </td>
            )}
            <td className="partner-col-date">
              <div className="booking-date-cell">
                <span>{formatDate(b.ngay_nhan_phong)}</span>
                {isCheckInToday && (
                  <span className="booking-today-badge">Hôm nay</span>
                )}
              </div>
            </td>
            <td className="partner-col-date">
              <div className="booking-date-cell">
                <span>{formatDate(b.ngay_tra_phong)}</span>
                {isCheckOutToday && (
                  <span className="booking-today-badge booking-today-badge--out">Hôm nay</span>
                )}
              </div>
            </td>
            <td className="partner-col-money" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {formatCurrency(b.thanh_toan_cuoi)}
            </td>
            <td className="partner-col-pay">
              <span className={`badge ${pay.badge || 'badge-default'}`}>{pay.shortLabel}</span>
            </td>
            <td className="partner-col-status">
              <span className={`badge ${stBadge.cls}`}>{stBadge.label}</span>
            </td>
            <ActionCell className="partner-col-actions">
              <ActionButton
                variant="view"
                iconOnly
                icon={Eye}
                title="Chi tiết"
                onClick={() => onViewDetail(b.ma_dat_phong)}
              />
              {onCancelBooking && !CANCEL_BLOCKED_STATUS.includes(b.trang_thai) && (
                <ActionButton
                  variant="reject"
                  iconOnly
                  icon={X}
                  title="Hủy đơn"
                  onClick={() => onCancelBooking(b)}
                />
              )}
            </ActionCell>
          </tr>
        );
      })}
    </tbody>
  );
}
