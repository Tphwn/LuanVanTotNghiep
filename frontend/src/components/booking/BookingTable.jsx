import { Eye, X } from 'lucide-react';
import ActionButton, { ActionCell } from '../common/ActionButton';
import {
  PARTNER_TRANG_THAI,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
} from '../../utils/bookingDisplay';

const CANCEL_BLOCKED_STATUS = ['hoan_thanh', 'da_huy', 'tu_choi', 'da_checkin'];

export default function BookingTable({ bookings, onViewDetail, onCancelBooking }) {
  return (
    <tbody>
      {bookings.map((b) => {
        const hotel = b.loai_phong?.khach_san;
        const st = PARTNER_TRANG_THAI[b.trang_thai] || { label: b.trang_thai, cls: '' };
        const pay = getPaymentDisplay(b);
        const customerName = b.khach_hang?.ho_ten || b.ten_nguoi_nhan || '—';

        return (
          <tr key={b.ma_dat_phong}>
            <td className="mgmt-table-cell-code">
              <span className="mgmt-cell-code" title={b.ma_don_hang}>{b.ma_don_hang}</span>
            </td>
            <td>
              <div className="admin-cell-name">{customerName}</div>
            </td>
            <td>
              <div className="admin-cell-name">{hotel?.ten || '—'}</div>
            </td>
            <td>
              <div className="mgmt-cell-sub">{b.loai_phong?.ten_loai || '—'}</div>
            </td>
            <td>{formatDate(b.ngay_nhan_phong)}</td>
            <td>{formatDate(b.ngay_tra_phong)}</td>
            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(b.thanh_toan_cuoi)}</td>
            <td>
              <span className={`mgmt-status-text ${pay.cls}`}>{pay.shortLabel}</span>
            </td>
            <td>
              <span className={`mgmt-status-text ${st.cls}`}>{st.label}</span>
            </td>
            <ActionCell>
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
