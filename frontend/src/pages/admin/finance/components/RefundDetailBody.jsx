import { AlertTriangle, CreditCard, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatCurrency,
  formatStayDateTime,
  REFUND_TRANG_THAI,
} from '../../../../utils/bookingDisplay';

const REFUND_STATUS = REFUND_TRANG_THAI;

const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${d.toLocaleDateString('vi-VN')} - ${time}`;
};

const InfoRow = ({ label, value }) => (
  <div className="refund-detail-info-row">
    <span className="refund-detail-info-label">{label}</span>
    <span className="refund-detail-info-value">{value ?? '—'}</span>
  </div>
);

/**
 * Bố cục chi tiết hoàn tiền dùng chung cho modal / page.
 */
export default function RefundDetailBody({
  refundDetail,
  canApprove,
  loading,
  onApproveClick,
  onClose,
}) {
  if (!refundDetail) return null;

  const refundStatus = REFUND_STATUS[refundDetail.trang_thai] || {
    label: refundDetail.trang_thai,
    cls: 'badge-default',
  };

  const booking = refundDetail.dat_phong;
  const hotel = booking?.loai_phong?.khach_san;
  const bookingId = booking?.ma_dat_phong;
  const checkIn = formatStayDateTime(booking?.ngay_nhan_phong, hotel?.gio_nhan_phong, '14:00');
  const checkOut = formatStayDateTime(booking?.ngay_tra_phong, hotel?.gio_tra_phong, '12:00');
  const maHoan = refundDetail.ma_hoan || `HT-${String(refundDetail.ma_hoan_tien).padStart(6, '0')}`;

  return (
    <div className="refund-detail-layout">
      <header className="refund-detail-hero">
        <div className="refund-detail-hero-main">
          <div className="refund-detail-hero-top">
            <span className="refund-detail-code">{maHoan}</span>
            <span className={`badge ${refundStatus.cls}`}>{refundStatus.label}</span>
          </div>
          <div className="refund-detail-amount">
            <span className="refund-detail-amount-label">Số tiền hoàn</span>
            <strong className="refund-detail-amount-value">
              {formatCurrency(refundDetail.so_tien_hoan)}
            </strong>
          </div>
        </div>
        <div className="refund-detail-hero-actions">
          {canApprove && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={loading}
              onClick={onApproveClick}
            >
              Xác nhận hoàn tiền
            </button>
          )}
        </div>
      </header>

      <div className="refund-detail-summary">
        <div className="refund-detail-summary-item">
          <span className="refund-detail-summary-label">Khách hàng</span>
          <strong>{refundDetail.khach_hang_ten || '—'}</strong>
        </div>
        <div className="refund-detail-summary-item">
          <span className="refund-detail-summary-label">Khách sạn</span>
          <strong>{refundDetail.ten_khach_san || '—'}</strong>
        </div>
        <div className="refund-detail-summary-item">
          <span className="refund-detail-summary-label">Ngày yêu cầu</span>
          <strong>{formatDateTime(refundDetail.ngay_yeu_cau)}</strong>
        </div>
        <div className="refund-detail-summary-item">
          <span className="refund-detail-summary-label">Phương thức</span>
          <strong>{refundDetail.phuong_thuc || '—'}</strong>
        </div>
        <div className="refund-detail-summary-item">
          <span className="refund-detail-summary-label">Người yêu cầu hủy</span>
          <strong>{refundDetail.nguoi_yeu_cau_huy || '—'}</strong>
        </div>
      </div>

      <div className="refund-detail-reason">
        <div className="refund-detail-reason-icon" aria-hidden>
          <AlertTriangle size={18} strokeWidth={2.2} />
        </div>
        <div className="refund-detail-reason-body">
          <h4>Lý do hủy</h4>
          <p>{refundDetail.ly_do_huy || '—'}</p>
        </div>
      </div>

      <div className="refund-detail-cards">
        <section className="refund-detail-card">
          <header className="refund-detail-card-header">
            <CreditCard size={18} strokeWidth={2} />
            <h4>Thông tin hoàn tiền</h4>
          </header>
          <div className="refund-detail-card-body">
            <InfoRow label="Mã hoàn" value={maHoan} />
            <InfoRow label="Người yêu cầu hủy" value={refundDetail.nguoi_yeu_cau_huy || '—'} />
            <InfoRow label="Ngày yêu cầu" value={formatDateTime(refundDetail.ngay_yeu_cau)} />
            <InfoRow label="Số tiền hoàn" value={formatCurrency(refundDetail.so_tien_hoan)} />
            <InfoRow label="Phương thức" value={refundDetail.phuong_thuc || '—'} />
            <InfoRow
              label="Ngày xử lý"
              value={refundDetail.ngay_xu_ly ? formatDateTime(refundDetail.ngay_xu_ly) : '—'}
            />
            <InfoRow
              label="Chi tiết tính toán"
              value={refundDetail.chi_tiet_tinh_toan || '—'}
            />
          </div>
        </section>

        <section className="refund-detail-card">
          <header className="refund-detail-card-header">
            <ClipboardList size={18} strokeWidth={2} />
            <h4>Thông tin đặt phòng</h4>
          </header>
          <div className="refund-detail-card-body">
            <InfoRow
              label="Mã đơn"
              value={
                bookingId ? (
                  <Link to={`/admin/bookings/${bookingId}`} className="mgmt-link">
                    {refundDetail.ma_don_hang || booking?.ma_don_hang || '—'}
                  </Link>
                ) : (
                  refundDetail.ma_don_hang || '—'
                )
              }
            />
            <InfoRow label="Khách hàng" value={refundDetail.khach_hang_ten || '—'} />
            <InfoRow label="Số điện thoại" value={refundDetail.khach_hang_sdt || '—'} />
            <InfoRow label="Khách sạn" value={refundDetail.ten_khach_san || '—'} />
            <InfoRow label="Loại phòng" value={refundDetail.ten_loai_phong || '—'} />
            <InfoRow label="Nhận phòng" value={`${checkIn.date} · ${checkIn.time}`} />
            <InfoRow label="Trả phòng" value={`${checkOut.date} · ${checkOut.time}`} />
            <InfoRow
              label="Tổng đơn"
              value={formatCurrency(refundDetail.tong_don || booking?.thanh_toan_cuoi)}
            />
          </div>
        </section>
      </div>

      <footer className="refund-detail-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Đóng
        </button>
      </footer>
    </div>
  );
}
