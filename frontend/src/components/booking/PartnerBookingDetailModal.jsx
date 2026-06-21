import { useState } from 'react';
import ActionButton, { TableActions } from '../common/ActionButton';
import DetailTable from './DetailTable';
import {
  TRANG_THAI,
  PHUONG_THUC,
  formatCurrency,
  formatDate,
  formatDateTime,
  diffDays,
} from '../../utils/bookingDisplay';

export default function PartnerBookingDetailModal({ booking, onClose, onConfirm, onReject, loading }) {
  const [rejectMode, setRejectMode] = useState(false);
  const [ly_do, setLyDo] = useState('');

  if (!booking) return null;

  const isPending = booking.trang_thai === 'cho_xac_nhan';
  const st = TRANG_THAI[booking.trang_thai] || { label: booking.trang_thai, cls: 'badge-default' };
  const nights = diffDays(booking.ngay_nhan_phong, booking.ngay_tra_phong);
  const payStatus = booking.thanh_toan?.trang_thai === 'thanh_cong' ? 'Đã thanh toán' : 'Chờ thanh toán';
  const payBadge = booking.thanh_toan?.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box booking-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Chi tiết đặt phòng</h3>
            <p className="booking-detail-code">#{booking.ma_don_hang}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="booking-detail-status-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span className="booking-detail-meta">Đặt lúc {formatDateTime(booking.ngay_dat)}</span>
          </div>
          {isPending && !rejectMode && (
            <TableActions style={{ justifyContent: 'flex-end' }}>
              <ActionButton variant="confirm" onClick={onConfirm} disabled={loading}>Xác nhận</ActionButton>
              <ActionButton variant="reject" onClick={() => setRejectMode(true)}>Từ chối</ActionButton>
            </TableActions>
          )}
        </div>

        {rejectMode && (
          <div className="booking-reject-box">
            <label className="booking-reject-label">
              Lý do từ chối <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <textarea
              rows={3}
              className="booking-reject-textarea"
              placeholder="Nhập lý do từ chối để khách hàng biết..."
              value={ly_do}
              onChange={(e) => setLyDo(e.target.value)}
            />
            <div className="booking-reject-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejectMode(false)}>Hủy</button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={() => {
                  if (!ly_do.trim()) return alert('Nhập lý do từ chối');
                  onReject(ly_do);
                }}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}

        <DetailTable
          title="Thông tin phòng"
          rows={[
            { label: 'Khách sạn', value: booking.loai_phong?.khach_san?.ten },
            { label: 'Loại phòng', value: booking.loai_phong?.ten_loai },
            { label: 'Nhận phòng', value: formatDate(booking.ngay_nhan_phong) },
            { label: 'Trả phòng', value: formatDate(booking.ngay_tra_phong) },
            { label: 'Số đêm', value: `${nights} đêm` },
            { label: 'Số khách', value: `${booking.so_khach} khách` },
          ]}
        />

        <DetailTable
          title="Thông tin khách"
          rows={[
            { label: 'Họ tên', value: booking.khach_hang?.ho_ten },
            { label: 'Email', value: booking.khach_hang?.nguoi_dung?.email },
            { label: 'SĐT', value: booking.khach_hang?.nguoi_dung?.so_dien_thoai },
            { label: 'Người nhận phòng', value: booking.ten_nguoi_nhan },
            { label: 'SĐT người nhận', value: booking.sdt_nguoi_nhan },
            ...(booking.ghi_chu ? [{ label: 'Ghi chú', value: booking.ghi_chu }] : []),
          ]}
        />

        <DetailTable
          title="Thanh toán"
          rows={[
            { label: 'Tổng tiền gốc', value: formatCurrency(booking.tong_tien_goc) },
            ...(Number(booking.tien_giam) > 0
              ? [{ label: 'Giảm giá', value: `- ${formatCurrency(booking.tien_giam)}` }]
              : []),
            { label: 'Thành tiền', value: <strong style={{ color: '#3C7363' }}>{formatCurrency(booking.thanh_toan_cuoi)}</strong> },
            { label: 'Phương thức', value: PHUONG_THUC[booking.phuong_thuc_tt] || booking.phuong_thuc_tt },
            { label: 'Trạng thái TT', value: <span className={`badge ${payBadge}`}>{payStatus}</span> },
            ...(booking.khuyen_mai
              ? [{ label: 'Khuyến mãi', value: `${booking.khuyen_mai.ma_code} — ${booking.khuyen_mai.ten}` }]
              : []),
          ]}
        />
      </div>
    </div>
  );
}
