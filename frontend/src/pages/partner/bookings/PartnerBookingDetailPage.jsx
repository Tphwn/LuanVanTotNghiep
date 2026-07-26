import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ActionButton, { TableActions } from '../../../components/common/ActionButton';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import DetailTable from '../../../components/booking/DetailTable';
import BookingSectionTable from '../../../components/booking/BookingSectionTable';
import BookingCancelNotice from '../../../components/booking/BookingCancelNotice';
import PartnerBookingCheckConfirmModal from './components/PartnerBookingCheckConfirmModal';
import {
  fetchBookingDetail,
  checkInBooking,
  checkOutBooking,
  clearDetail,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import {
  TRANG_THAI,
  PHUONG_THUC,
  getPaymentDisplay,
  getRefundBadgeMeta,
  getBookingSpecialRequest,
  formatCurrency,
  formatDate,
  formatStayDateTime,
  addDays,
  diffDays,
  canPartnerCheckIn,
  canPartnerCheckOut,
} from '../../../utils/bookingDisplay';

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

export default function PartnerBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { detail, detailLoading, actionLoading, error, successMsg } = useSelector(
    (s) => s.partnerBooking || {},
  );

  const [checkConfirmAction, setCheckConfirmAction] = useState(null);
  const [checkActionLoading, setCheckActionLoading] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchBookingDetail(id));
    return () => { dispatch(clearDetail()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [successMsg, error, dispatch]);

  const bookingStatus = useMemo(() => {
    if (!detail) return { label: '—', cls: 'badge-default' };
    return TRANG_THAI[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };
  }, [detail]);

  const paymentInfo = useMemo(() => getPaymentDisplay(detail), [detail]);

  const roomRows = useMemo(() => {
    if (!detail) return [];
    const hotel = detail.loai_phong?.khach_san;
    const nights = diffDays(detail.ngay_nhan_phong, detail.ngay_tra_phong);
    const checkIn = formatStayDateTime(detail.ngay_nhan_phong, hotel?.gio_nhan_phong, '14:00');
    const checkOut = formatStayDateTime(detail.ngay_tra_phong, hotel?.gio_tra_phong, '12:00');

    return [
      { label: 'Khách sạn', value: hotel?.ten || '—' },
      { label: 'Loại phòng', value: detail.loai_phong?.ten_loai || '—' },
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

  const handleBack = () => navigate('/partner/bookings');

  const handleCheckInClick = () => {
    if (!detail) return;
    setCheckConfirmAction('check-in');
  };

  const handleCheckOutClick = () => {
    if (!detail) return;
    setCheckConfirmAction('check-out');
  };

  const handleCloseCheckConfirm = () => {
    if (checkActionLoading) return;
    setCheckConfirmAction(null);
  };

  const handleConfirmCheckAction = async () => {
    if (!detail || !checkConfirmAction) return;

    setCheckActionLoading(true);
    dispatch(clearMsg());
    const thunk = checkConfirmAction === 'check-in' ? checkInBooking : checkOutBooking;
    const result = await dispatch(thunk(detail.ma_dat_phong));
    setCheckActionLoading(false);

    if (thunk.fulfilled.match(result)) {
      setCheckConfirmAction(null);
      return;
    }

    setCheckConfirmAction(null);
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
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy đơn đặt phòng</p>
        <BackButton variant="outline" onClick={handleBack} />
      </div>
    );
  }

  const showCheckInAction = canPartnerCheckIn(detail);
  const showCheckOutAction = canPartnerCheckOut(detail);
  const isCancelled = ['da_huy', 'tu_choi'].includes(detail.trang_thai);
  const refundInfo = detail.thong_tin_hoan_tien;
  const refundBadge = (Number(refundInfo?.so_tien_hoan) || 0) > 0
    ? getRefundBadgeMeta(refundInfo?.trang_thai_hoan)
    : null;

  const paymentMethod =
    PHUONG_THUC[detail.phuong_thuc_tt] || detail.thanh_toan?.phuong_thuc || detail.phuong_thuc_tt || '—';

  const paymentRows = [
    {
      key: 'payment',
      cells: [
        formatCurrency(detail.thanh_toan_cuoi),
        <span className={`badge ${paymentInfo.badge}`}>{paymentInfo.label}</span>,
        paymentMethod,
      ],
      cellProps: [{ style: { fontWeight: 500 } }, {}, {}],
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
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {successMsg || error}
        </div>
      )}

      <PartnerBookingCheckConfirmModal
        booking={checkConfirmAction ? detail : null}
        action={checkConfirmAction}
        loading={checkActionLoading}
        onClose={handleCloseCheckConfirm}
        onConfirm={handleConfirmCheckAction}
      />

      <div className="content-card booking-detail-page-card">
        <div className="booking-detail-status-bar booking-detail-status-bar--page">
          <div className="booking-detail-status-left">
            <span className={`badge ${bookingStatus.cls}`}>{bookingStatus.label}</span>
          </div>
          <div className="booking-detail-status-right">
            {isCancelled && refundBadge && (
              <span className={`badge ${refundBadge.cls}`}>{refundBadge.label}</span>
            )}
            {showCheckInAction && (
              <TableActions style={{ justifyContent: 'flex-end' }}>
                <ActionButton variant="confirm" onClick={handleCheckInClick} disabled={actionLoading}>
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận check-in'}
                </ActionButton>
              </TableActions>
            )}
            {showCheckOutAction && (
              <TableActions style={{ justifyContent: 'flex-end' }}>
                <ActionButton variant="confirm" onClick={handleCheckOutClick} disabled={actionLoading}>
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận check-out'}
                </ActionButton>
              </TableActions>
            )}
          </div>
        </div>

        {isCancelled && refundInfo && (
          <BookingCancelNotice refundInfo={refundInfo} booking={detail} />
        )}

        <div className="booking-detail-grid">
          <DetailTable title="Thông tin phòng" rows={roomRows} />
          <DetailTable title="Thông tin khách" rows={guestRows} />
        </div>

        <BookingSectionTable
          title="Thanh toán"
          columns={['Tổng tiền', 'Trạng thái', 'Phương thức']}
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
