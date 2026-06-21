import { Eye } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import { TRANG_THAI, formatCurrency, formatDate } from '../../../../utils/bookingDisplay';

export default function BookingTable({ bookings, onViewDetail }) {
  return (
    <tbody>
      {bookings.map((b) => {
        const st = TRANG_THAI[b.trang_thai] || { label: b.trang_thai, cls: 'badge-default' };
        return (
          <tr key={b.ma_dat_phong}>
            <td style={{ fontWeight: 500, color: '#3C7363' }}>#{b.ma_don_hang}</td>
            <td>
              <div className="mgmt-cell-name">{b.ten_nguoi_nhan}</div>
              <div className="mgmt-cell-sub">{b.khach_hang?.ho_ten}</div>
            </td>
            <td>
              <div className="mgmt-cell-name">{b.loai_phong?.khach_san?.ten}</div>
              <div className="mgmt-cell-sub">{b.loai_phong?.ten_loai}</div>
            </td>
            <td style={{ fontSize: 13 }}>{formatDate(b.ngay_nhan_phong)}</td>
            <td style={{ fontSize: 13 }}>{formatDate(b.ngay_tra_phong)}</td>
            <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{formatCurrency(b.thanh_toan_cuoi)}</td>
            <td>
              <span className={`badge ${b.thanh_toan?.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                {b.thanh_toan?.trang_thai === 'thanh_cong' ? 'Đã TT' : 'Chờ TT'}
              </span>
            </td>
            <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
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
