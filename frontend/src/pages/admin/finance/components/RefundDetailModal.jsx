import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DetailTable from '../../../../components/booking/DetailTable';
import {
  approveRefund,
  clearRefundDetail,
  fetchRefundById,
} from '../../../../store/slices/adminFinanceSlice';
import {
  formatCurrency,
  formatDate,
  formatStayDateTime,
  REFUND_TRANG_THAI,
  TRANG_THAI,
} from '../../../../utils/bookingDisplay';

const REFUND_STATUS = REFUND_TRANG_THAI;
const BOOKING_STATUS = TRANG_THAI;

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

export default function RefundDetailModal({ id, onClose }) {
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    refundDetail,
    refundDetailLoading,
    loading,
  } = useSelector((s) => s.adminFinance || {});

  useEffect(() => {
    if (id) dispatch(fetchRefundById(id));
    return () => { dispatch(clearRefundDetail()); };
  }, [dispatch, id]);

  const refundStatus = useMemo(() => {
    if (!refundDetail) return { label: '—', cls: 'badge-default' };
    return REFUND_STATUS[refundDetail.trang_thai] || {
      label: refundDetail.trang_thai,
      cls: 'badge-default',
    };
  }, [refundDetail]);

  const requestRows = useMemo(() => {
    if (!refundDetail) return [];
    return [
      { label: 'Mã hoàn', value: refundDetail.ma_hoan || `#${refundDetail.ma_hoan_tien}` },
      { label: 'Ngày yêu cầu', value: formatDateTime(refundDetail.ngay_yeu_cau) },
      { label: 'Phương thức', value: refundDetail.phuong_thuc || '—' },
      { label: 'Số tiền hoàn', value: formatCurrency(refundDetail.so_tien_hoan) },
      {
        label: 'Ngày xử lý',
        value: refundDetail.ngay_xu_ly ? formatDateTime(refundDetail.ngay_xu_ly) : '—',
      },
    ];
  }, [refundDetail]);

  const bookingRows = useMemo(() => {
    if (!refundDetail) return [];
    const booking = refundDetail.dat_phong;
    const hotel = booking?.loai_phong?.khach_san;
    const bookingId = booking?.ma_dat_phong;
    const checkIn = formatStayDateTime(booking?.ngay_nhan_phong, hotel?.gio_nhan_phong, '14:00');
    const checkOut = formatStayDateTime(booking?.ngay_tra_phong, hotel?.gio_tra_phong, '12:00');
    const bookingSt = BOOKING_STATUS[booking?.trang_thai]?.label || booking?.trang_thai || '—';

    return [
      {
        label: 'Mã đơn',
        value: bookingId ? (
          <Link to={`/admin/bookings/${bookingId}`} className="mgmt-link">
            {refundDetail.ma_don_hang || booking?.ma_don_hang}
          </Link>
        ) : (refundDetail.ma_don_hang || '—'),
      },
      { label: 'Khách hàng', value: refundDetail.khach_hang_ten || '—' },
      { label: 'Số điện thoại', value: refundDetail.khach_hang_sdt || '—' },
      { label: 'Khách sạn', value: refundDetail.ten_khach_san || '—' },
      { label: 'Loại phòng', value: refundDetail.ten_loai_phong || '—' },
      { label: 'Đối tác', value: refundDetail.ten_doi_tac || '—' },
      { label: 'Trạng thái đơn', value: bookingSt },
      { label: 'Nhận phòng', value: `${checkIn.date} · ${checkIn.time}` },
      { label: 'Trả phòng', value: `${checkOut.date} · ${checkOut.time}` },
      { label: 'Số khách', value: `${booking?.so_khach || 0} khách` },
      { label: 'Tổng đơn', value: formatCurrency(refundDetail.tong_don || booking?.thanh_toan_cuoi) },
      { label: 'Ngày đặt', value: formatDate(booking?.ngay_dat) },
    ];
  }, [refundDetail]);

  const canApprove = refundDetail
    && ['cho_xu_ly', 'dang_xu_ly'].includes(refundDetail.trang_thai);

  const handleConfirmRefund = () => {
    dispatch(approveRefund(refundDetail.ma_hoan_tien)).finally(() => {
      setConfirmOpen(false);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box finance-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            Chi tiết hoàn tiền {refundDetail ? (refundDetail.ma_hoan || `#${refundDetail.ma_hoan_tien}`) : ''}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="finance-detail-modal-body">
          {refundDetailLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
              Đang tải chi tiết yêu cầu hoàn tiền...
            </div>
          ) : !refundDetail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
              Không tìm thấy yêu cầu hoàn tiền
            </div>
          ) : (
            <>
              <div className="booking-detail-status-bar" style={{ marginBottom: 16 }}>
                <span className={`badge ${refundStatus.cls}`}>{refundStatus.label}</span>
              </div>

              <div className="booking-detail-reason-box" style={{ marginBottom: 16 }}>
                <h4 className="booking-detail-section-title">Lý do hủy</h4>
                <p style={{ margin: 0, fontSize: 14, color: '#1a2e28', lineHeight: 1.6 }}>
                  {refundDetail.ly_do_huy || '—'}
                </p>
              </div>

              <div
                className="booking-detail-calc-box"
                style={{
                  marginBottom: 16,
                  padding: '16px 18px',
                  background: '#f0faf7',
                  border: '1px solid #d4ede6',
                  borderRadius: 10,
                }}
              >
                <h4 className="booking-detail-section-title" style={{ marginTop: 0 }}>Chi tiết tính toán</h4>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a2e28' }}>
                  {refundDetail.chi_tiet_tinh_toan || '—'}
                </p>
              </div>

              <div className="booking-detail-grid">
                <DetailTable title="Thông tin yêu cầu" rows={requestRows} />
                <DetailTable title="Thông tin đơn đặt phòng" rows={bookingRows} />
              </div>
            </>
          )}
        </div>

        <div className="finance-detail-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {canApprove && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={() => setConfirmOpen(true)}
            >
              Hoàn tiền
            </button>
          )}
        </div>
      </div>

      {confirmOpen && refundDetail && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={(e) => { e.stopPropagation(); setConfirmOpen(false); }}
          role="presentation"
        >
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận hoàn tiền</h3>
              <button type="button" className="modal-close" onClick={() => setConfirmOpen(false)}>×</button>
            </div>
            <p style={{ fontSize: 14, color: '#1a2e28', lineHeight: 1.6, margin: '0 0 16px' }}>
              Bạn có chắc muốn hoàn{' '}
              <strong>{formatCurrency(refundDetail.so_tien_hoan)}</strong>{' '}
              cho khách <strong>{refundDetail.khach_hang_ten}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={handleConfirmRefund}
              >
                Xác nhận hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
