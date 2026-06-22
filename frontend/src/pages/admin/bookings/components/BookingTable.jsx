import { Eye } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import { formatCurrency, formatDate } from '../../../../utils/bookingDisplay';

const BOOKING_STATUS = {
  cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'mgmt-status-text--pending' },
  da_xac_nhan: { label: 'Đã xác nhận', cls: 'mgmt-status-text--info' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'mgmt-status-text--active' },
  da_huy: { label: 'Đã hủy', cls: 'mgmt-status-text--locked' },
  tu_choi: { label: 'Từ chối', cls: 'mgmt-status-text--locked' },
};

const PAY_STATUS = {
  thanh_cong: { label: 'Đã TT', cls: 'mgmt-status-text--active' },
  default: { label: 'Chờ TT', cls: 'mgmt-status-text--pending' },
};

export default function BookingTable({ bookings, onViewDetail }) {
  return (
    <tbody>
      {bookings.map((b) => {
        const st = BOOKING_STATUS[b.trang_thai] || { label: b.trang_thai, cls: '' };
        const payKey = b.thanh_toan?.trang_thai === 'thanh_cong' ? 'thanh_cong' : 'default';
        const pay = PAY_STATUS[payKey];
        return (
          <tr key={b.ma_dat_phong}>
            <td className="mgmt-table-cell-code">
              <span className="mgmt-cell-code" title={`#${b.ma_don_hang}`}>#{b.ma_don_hang}</span>
            </td>
            <td>
              <div className="mgmt-cell-name">{b.ten_nguoi_nhan}</div>
              <div className="mgmt-cell-sub">{b.khach_hang?.ho_ten}</div>
            </td>
            <td>
              <div className="mgmt-cell-name">{b.loai_phong?.khach_san?.ten}</div>
              <div className="mgmt-cell-sub">{b.loai_phong?.ten_loai}</div>
            </td>
            <td style={{ fontSize: 13, color: '#64748b' }}>{formatDate(b.ngay_nhan_phong)}</td>
            <td style={{ fontSize: 13, color: '#64748b' }}>{formatDate(b.ngay_tra_phong)}</td>
            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(b.thanh_toan_cuoi)}</td>
            <td>
              <span className={`mgmt-status-text ${pay.cls}`}>{pay.label}</span>
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
            </ActionCell>
          </tr>
        );
      })}
    </tbody>
  );
}
