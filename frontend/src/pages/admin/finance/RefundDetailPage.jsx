import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DetailTable from '../../../components/booking/DetailTable';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import {
  approveRefund,
  clearMsg,
  clearRefundDetail,
  fetchRefundById,
} from '../../../store/slices/adminFinanceSlice';
import { formatCurrency, formatDate, formatStayDateTime } from '../../../utils/bookingDisplay';

const REFUND_STATUS = {
  cho_xu_ly: { label: 'Chờ xử lý', cls: 'badge-warning' },
  dang_xu_ly: { label: 'Đang xử lý', cls: 'badge-info' },
  da_hoan: { label: 'Đã hoàn', cls: 'badge-success' },
  tu_choi: { label: 'Từ chối', cls: 'badge-danger' },
};

const BOOKING_STATUS = {
  cho_xac_nhan: { label: 'Chờ xác nhận' },
  da_xac_nhan: { label: 'Đã xác nhận' },
  da_checkin: { label: 'Đã check-in' },
  tu_choi: { label: 'Từ chối' },
  da_huy: { label: 'Đã hủy' },
  hoan_thanh: { label: 'Hoàn thành' },
};

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

export default function RefundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    refundDetail,
    refundDetailLoading,
    loading,
    successMsg,
    error,
  } = useSelector((s) => s.adminFinance || {});

  useEffect(() => {
    if (id) dispatch(fetchRefundById(id));
    return () => { dispatch(clearRefundDetail()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

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

  const handleBack = () => {
    navigate(location.state?.returnTo || '/admin/finance?tab=refunds');
  };

  const canApprove = refundDetail
    && ['cho_xu_ly', 'dang_xu_ly'].includes(refundDetail.trang_thai);

  const handleConfirmRefund = () => {
    dispatch(approveRefund(refundDetail.ma_hoan_tien)).finally(() => {
      setConfirmOpen(false);
    });
  };

  if (refundDetailLoading) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 60 }}>
        Đang tải chi tiết yêu cầu hoàn tiền...
      </div>
    );
  }

  if (!refundDetail) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy yêu cầu hoàn tiền</p>
        <BackButton variant="outline" onClick={handleBack} />
      </div>
    );
  }

  return (
    <div className="booking-detail-page mgmt-page">
      <ManagementHeader
        title="Tài chính"
        subtitle={`Chi tiết hoàn tiền ${refundDetail.ma_hoan || `#${refundDetail.ma_hoan_tien}`}`}
        onBack={handleBack}
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {successMsg || error}
        </div>
      )}

      <div className="content-card booking-detail-page-card">
        <div className="booking-detail-status-bar booking-detail-status-bar--page">
          <div className="booking-detail-status-left">
            <span className={`badge ${refundStatus.cls}`}>{refundStatus.label}</span>
          </div>
          {canApprove && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={loading}
              onClick={() => setConfirmOpen(true)}
            >
              Hoàn tiền
            </button>
          )}
        </div>

        <div className="booking-detail-reason-box" style={{ marginBottom: 20 }}>
          <h4 className="booking-detail-section-title">Lý do hủy</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#1a2e28', lineHeight: 1.6 }}>
            {refundDetail.ly_do_huy || '—'}
          </p>
        </div>

        <div className="booking-detail-calc-box" style={{
          marginBottom: 20,
          padding: '16px 18px',
          background: '#f0faf7',
          border: '1px solid #d4ede6',
          borderRadius: 10,
        }}>
          <h4 className="booking-detail-section-title" style={{ marginTop: 0 }}>Chi tiết tính toán</h4>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a2e28' }}>
            {refundDetail.chi_tiet_tinh_toan || '—'}
          </p>
        </div>

        <div className="booking-detail-grid">
          <DetailTable title="Thông tin yêu cầu" rows={requestRows} />
          <DetailTable title="Thông tin đơn đặt phòng" rows={bookingRows} />
        </div>
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
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
