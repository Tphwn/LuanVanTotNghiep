import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  fetchAdminBookingDetail,
  cancelAdminBooking,
  fetchBookingStats,
  fetchAdminBookings,
  clearDetail,
  clearMsg,
} from '../../../store/slices/adminBookingSlice';
import { approveRefund } from '../../../store/slices/adminFinanceSlice';

import DetailTable from '../../../components/booking/DetailTable';
import BookingSectionTable from '../../../components/booking/BookingSectionTable';
import BookingCancelNotice from '../../../components/booking/BookingCancelNotice';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ReasonField from '../../../components/common/ReasonField';
import {
  buildAdminBookingsListPath,
  bookingStatusToListTab,
} from '../../../utils/adminListReturn';

import {
  getBookingStatusDisplay,
  getPaymentDisplay,
  getPaymentGatewayLabel,
  getBookingVatAmount,
  getRefundBadgeMeta,
  getBookingSpecialRequest,
  formatCurrency,
  formatDate,
  formatStayDateTime,
  addDays,
  diffDays,
} from '../../../utils/bookingDisplay';

const CANCEL_BLOCKED_STATUS = ['hoan_thanh', 'da_huy', 'tu_choi', 'da_checkin'];

const getPriceTypeLabel = (type) => {
  const labels = {
    co_ban: 'Cơ bản',
    cuoi_tuan: 'Cuối tuần',
    le_tet: 'Lễ tết',
    cao_diem: 'Cao điểm',
  };
  return labels[type] || 'Khác';
};

const getPriceTypeBadge = (type) => {
  const badges = {
    co_ban: 'badge-default',
    cuoi_tuan: 'badge-warning',
    le_tet: 'badge-danger',
    cao_diem: 'badge-info',
  };
  return badges[type] || 'badge-default';
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    detail,
    detailLoading,
    loading,
    error,
    successMsg,
  } = useSelector((state) => state.adminBooking || {});

  const [cancelMode, setCancelMode] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const backTo = location.state?.returnTo
    || buildAdminBookingsListPath(bookingStatusToListTab(detail?.trang_thai));

  useEffect(() => {
    if (id) {
      dispatch(fetchAdminBookingDetail(id));
    }

    return () => {
      dispatch(clearDetail());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!successMsg && !error) return undefined;

    const timer = setTimeout(() => {
      dispatch(clearMsg());
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMsg, error, dispatch]);

  const bookingStatus = useMemo(() => getBookingStatusDisplay(detail), [detail]);

  const paymentInfo = useMemo(() => getPaymentDisplay(detail), [detail]);

  const canCancel = detail && !CANCEL_BLOCKED_STATUS.includes(detail.trang_thai);

  const roomRows = useMemo(() => {
    if (!detail) return [];

    const hotel = detail.loai_phong?.khach_san;
    const nights = diffDays(detail.ngay_nhan_phong, detail.ngay_tra_phong);
    const checkIn = formatStayDateTime(detail.ngay_nhan_phong, hotel?.gio_nhan_phong, '14:00');
    const checkOut = formatStayDateTime(detail.ngay_tra_phong, hotel?.gio_tra_phong, '12:00');

    return [
      { label: 'Khách sạn', value: hotel?.ten || '—' },
      { label: 'Đối tác', value: hotel?.doi_tac?.ten_cong_ty || '—' },
      { label: 'Loại phòng', value: detail.loai_phong?.ten_loai || '—' },
      { label: 'Địa chỉ', value: hotel?.dia_chi || '—' },
      { label: 'Nhận phòng', value: `${checkIn.date} · ${checkIn.time}` },
      { label: 'Trả phòng', value: `${checkOut.date} · ${checkOut.time}` },
      { label: 'Số đêm', value: `${nights} đêm` },
      { label: 'Số khách', value: `${detail.so_khach || 0} khách` },
      { label: 'Số phòng', value: `${detail.so_phong || 1} phòng` },
    ];
  }, [detail]);

  const guestRows = useMemo(() => {
    if (!detail) return [];

    return [
      { label: 'Khách hàng', value: detail.khach_hang?.ho_ten || '—' },
      { label: 'Email tài khoản', value: detail.khach_hang?.nguoi_dung?.email || '—' },
      { label: 'SĐT', value: detail.khach_hang?.nguoi_dung?.so_dien_thoai || '—' },
      { label: 'Người nhận phòng', value: detail.ten_nguoi_nhan || '—' },
      { label: 'SĐT người nhận', value: detail.sdt_nguoi_nhan || '—' },
      { label: 'Email liên hệ', value: detail.email_nguoi_nhan || detail.khach_hang?.nguoi_dung?.email || '—' },
      { label: 'Ghi chú', value: getBookingSpecialRequest(detail) || '—' },
    ];
  }, [detail]);

  const handleBack = () => {
    navigate(backTo);
  };

  const closeCancelBox = () => {
    setCancelMode(false);
    setLyDo('');
    setCancelError('');
  };

  const handleCompleteRefund = async () => {
    if (!detail?.hoan_tien?.ma_hoan_tien) return;

    setRefundLoading(true);
    const result = await dispatch(approveRefund(detail.hoan_tien.ma_hoan_tien));
    setRefundLoading(false);

    if (approveRefund.fulfilled.match(result)) {
      dispatch(fetchAdminBookingDetail(id));
    }
  };

  const refundPending = ['cho_xu_ly', 'dang_xu_ly'].includes(detail?.hoan_tien?.trang_thai)
    && Number(detail?.hoan_tien?.so_tien_hoan) > 0;

  const handleCancelBooking = async () => {
    if (!detail) return;

    if (!lyDo.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đơn');
      return;
    }

    const result = await dispatch(
      cancelAdminBooking({
        id: detail.ma_dat_phong,
        ly_do: lyDo.trim(),
      }),
    );

    if (cancelAdminBooking.fulfilled.match(result)) {
      dispatch(fetchBookingStats());
      dispatch(fetchAdminBookings());
      navigate(backTo);
    }
  };

  if (detailLoading) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 60 }}>
        Đang tải chi tiết đơn đặt phòng...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>
          Không tìm thấy đơn đặt phòng
        </p>

        <BackButton variant="outline" onClick={handleBack} />
      </div>
    );
  }

  const isCancelled = ['da_huy', 'tu_choi'].includes(detail.trang_thai);
  const refundInfo = detail.thong_tin_hoan_tien;
  const refundAmount = Number(refundInfo?.so_tien_hoan) || 0;
  const refundBadge = refundAmount > 0
    ? getRefundBadgeMeta(refundInfo?.trang_thai_hoan)
    : null;

  const paymentMethod = getPaymentGatewayLabel(detail);
  const vatAmount = getBookingVatAmount(detail);
  const discountAmount = Number(detail.tien_giam) || 0;
  const promoCode = detail.khuyen_mai?.ma_code || null;
  const showPromo = discountAmount > 0 && Boolean(promoCode);

  const paymentColumns = showPromo
    ? ['Tiền ban đầu', 'Tiền phí (VAT)', 'Mã giảm', 'Tiền thanh toán', 'Trạng thái', 'Phương thức']
    : ['Tiền ban đầu', 'Tiền phí (VAT)', 'Tiền thanh toán', 'Trạng thái', 'Phương thức'];

  const paymentRows = [
    {
      key: 'payment',
      cells: showPromo
        ? [
          formatCurrency(detail.tong_tien_goc),
          formatCurrency(vatAmount),
          `${promoCode} (−${formatCurrency(discountAmount)})`,
          formatCurrency(detail.thanh_toan_cuoi),
          <span className={`badge ${paymentInfo.badge}`}>{paymentInfo.label}</span>,
          paymentMethod,
        ]
        : [
          formatCurrency(detail.tong_tien_goc),
          formatCurrency(vatAmount),
          formatCurrency(detail.thanh_toan_cuoi),
          <span className={`badge ${paymentInfo.badge}`}>{paymentInfo.label}</span>,
          paymentMethod,
        ],
      cellProps: showPromo
        ? [{ style: { fontWeight: 500 } }, {}, {}, { style: { fontWeight: 600 } }, {}, {}]
        : [{ style: { fontWeight: 500 } }, {}, { style: { fontWeight: 600 } }, {}, {}],
    },
  ];

  const nightlyRows = (detail.chi_tiet_dat_phong || []).map((item) => ({
    key: item.ma_chi_tiet,
    cells: [
      formatDate(item.ngay),
      formatDate(addDays(item.ngay, 1)),
      formatCurrency(item.don_gia),
      <span className={`badge ${getPriceTypeBadge(item.loai_gia)}`}>
        {getPriceTypeLabel(item.loai_gia)}
      </span>,
    ],
    cellProps: [{}, {}, { style: { fontWeight: 500 } }, {}],
  }));

  return (
    <div className="booking-detail-page mgmt-page">
      <ManagementHeader
        title="Quản lý đặt phòng"
        subtitle={`Chi tiết đơn ${detail.ma_don_hang}`}
        onBack={handleBack}
      />

      {(successMsg || error) && (
        <div
          className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}
          style={{ marginBottom: 16 }}
        >
          {successMsg || error}
        </div>
      )}

      <div className="content-card booking-detail-page-card">
        <div className="booking-detail-status-bar booking-detail-status-bar--page">
          <div className="booking-detail-status-left">
            <span className={`badge ${bookingStatus.cls}`}>
              {bookingStatus.label}
            </span>
          </div>

          <div className="booking-detail-status-right">
            {isCancelled && refundBadge && (
              <span className={`badge ${refundBadge.cls}`}>{refundBadge.label}</span>
            )}

            {canCancel && !cancelMode && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setCancelMode(true)}
              >
                Hủy đơn
              </button>
            )}

            {refundPending && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={refundLoading}
                onClick={handleCompleteRefund}
              >
                {refundLoading ? 'Đang xử lý...' : 'Hoàn tất'}
              </button>
            )}
          </div>
        </div>

        {cancelMode && (
          <div className="booking-reject-box">
            <p className="booking-reject-warning">
              Hủy đơn sẽ cập nhật trạng thái đơn và thông báo cho khách hàng.
              Vui lòng nhập lý do rõ ràng.
            </p>

            <ReasonField
              id="admin-booking-cancel-reason"
              label="Lý do hủy"
              required
              rows={3}
              value={lyDo}
              onChange={(e) => {
                setLyDo(e.target.value);
                if (cancelError) setCancelError('');
              }}
              error={cancelError}
              placeholder="VD: Khách sạn không đủ điều kiện phục vụ..."
            />

            <div className="booking-reject-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeCancelBox}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={handleCancelBooking}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        )}

        {isCancelled && refundInfo && (
          <BookingCancelNotice refundInfo={refundInfo} booking={detail} />
        )}

        <div className="booking-detail-grid">
          <DetailTable title="Thông tin phòng" rows={roomRows} />
          <DetailTable title="Thông tin khách" rows={guestRows} />
        </div>

        <BookingSectionTable
          title="Thanh toán"
          columns={paymentColumns}
          rows={paymentRows}
        />

        <BookingSectionTable
          title="Chi tiết giá từng đêm"
          columns={['Ngày nhận', 'Ngày trả', 'Giá/đêm', 'Loại giá']}
          rows={nightlyRows}
        />
      </div>
    </div>
  );
}
