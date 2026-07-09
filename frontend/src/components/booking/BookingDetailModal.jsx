import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ActionButton, { TableActions } from '../common/ActionButton';
import DetailTable from './DetailTable';
import BookingSectionTable from './BookingSectionTable';
import BookingCancelNotice from './BookingCancelNotice';
import {
  fetchAdminBookingDetail,
  cancelAdminBooking,
  fetchBookingStats,
  fetchAdminBookings,
  clearDetail as clearAdminDetail,
  clearMsg as clearAdminMsg,
} from '../../store/slices/adminBookingSlice';
import { approveRefund } from '../../store/slices/adminFinanceSlice';
import {
  fetchBookingDetail,
  checkInBooking,
  checkOutBooking,
  clearDetail as clearPartnerDetail,
  clearMsg as clearPartnerMsg,
} from '../../store/slices/partnerBookingSlice';
import PartnerBookingCheckConfirmModal from '../../pages/partner/bookings/components/PartnerBookingCheckConfirmModal';
import {
  TRANG_THAI,
  PHUONG_THUC,
  getPaymentDisplay,
  getRefundBadgeMeta,
  formatCurrency,
  formatDate,
  formatStayDateTime,
  addDays,
  diffDays,
  getBookingCancelReason,
  canPartnerCheckIn,
  canPartnerCheckOut,
} from '../../utils/bookingDisplay';

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

const BookingDetailModal = ({
  isOpen,
  bookingId,
  role = 'admin',
  onClose,
  onUpdated,
  listFilters,
}) => {
  const dispatch = useDispatch();
  const isAdmin = role === 'admin';

  const adminState = useSelector((s) => s.adminBooking || {});
  const partnerState = useSelector((s) => s.partnerBooking || {});

  const detail = isAdmin ? adminState.detail : partnerState.detail;
  const detailLoading = isAdmin ? adminState.detailLoading : partnerState.detailLoading;
  const loading = isAdmin ? adminState.loading : partnerState.actionLoading;
  const error = isAdmin ? adminState.error : partnerState.error;
  const successMsg = isAdmin ? adminState.successMsg : partnerState.successMsg;

  const [cancelMode, setCancelMode] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [checkConfirmAction, setCheckConfirmAction] = useState(null);
  const [checkActionLoading, setCheckActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !bookingId) return undefined;

    if (isAdmin) {
      dispatch(fetchAdminBookingDetail(bookingId));
    } else {
      dispatch(fetchBookingDetail(bookingId));
    }

    return () => {
      if (isAdmin) {
        dispatch(clearAdminDetail());
      } else {
        dispatch(clearPartnerDetail());
      }
    };
  }, [dispatch, isOpen, bookingId, isAdmin]);

  useEffect(() => {
    if (!isOpen) {
      setCancelMode(false);
      setLyDo('');
      setCheckConfirmAction(null);
      setCheckActionLoading(false);
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (!successMsg && !error) return undefined;
    const timer = setTimeout(() => {
      if (isAdmin) dispatch(clearAdminMsg());
      else dispatch(clearPartnerMsg());
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMsg, error, dispatch, isAdmin]);

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

    const rows = [
      { label: 'Khách sạn', value: hotel?.ten || '—' },
      ...(isAdmin ? [{ label: 'Đối tác', value: hotel?.doi_tac?.ten_cong_ty || '—' }] : []),
      { label: 'Loại phòng', value: detail.loai_phong?.ten_loai || '—' },
      ...(isAdmin ? [{ label: 'Địa chỉ', value: hotel?.dia_chi || '—' }] : []),
      { label: 'Nhận phòng', value: `${checkIn.date} · ${checkIn.time}` },
      { label: 'Trả phòng', value: `${checkOut.date} · ${checkOut.time}` },
      { label: 'Số đêm', value: `${nights} đêm` },
      { label: 'Số khách', value: `${detail.so_khach || 0} khách` },
    ];
    return rows;
  }, [detail, isAdmin]);

  const guestRows = useMemo(() => {
    if (!detail) return [];
    return [
      { label: 'Khách hàng', value: detail.khach_hang?.ho_ten || '—' },
      { label: 'Email', value: detail.khach_hang?.nguoi_dung?.email || '—' },
      { label: 'SĐT', value: detail.khach_hang?.nguoi_dung?.so_dien_thoai || '—' },
      { label: 'Người nhận phòng', value: detail.ten_nguoi_nhan || '—' },
      { label: 'SĐT người nhận', value: detail.sdt_nguoi_nhan || '—' },
      { label: 'Ghi chú', value: detail.ghi_chu || '—' },
    ];
  }, [detail]);

  const closeCancelBox = () => {
    setCancelMode(false);
    setLyDo('');
  };

  const handleCompleteRefund = async () => {
    if (!detail?.hoan_tien?.ma_hoan_tien) return;
    setRefundLoading(true);
    const result = await dispatch(approveRefund(detail.hoan_tien.ma_hoan_tien));
    setRefundLoading(false);
    if (approveRefund.fulfilled.match(result)) {
      dispatch(fetchAdminBookingDetail(bookingId));
      onUpdated?.();
    }
  };

  const handleCancelBooking = async () => {
    if (!detail) return;
    if (!lyDo.trim()) {
      alert('Phải kèm lý do mới được hủy');
      return;
    }
    const result = await dispatch(cancelAdminBooking({
      id: detail.ma_dat_phong,
      ly_do: lyDo.trim(),
    }));
    if (cancelAdminBooking.fulfilled.match(result)) {
      dispatch(fetchBookingStats());
      dispatch(fetchAdminBookings(listFilters || {}));
      onUpdated?.();
      onClose?.();
    }
  };

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
    if (!isAdmin) dispatch(clearPartnerMsg());
    const thunk = checkConfirmAction === 'check-in' ? checkInBooking : checkOutBooking;
    const result = await dispatch(thunk(detail.ma_dat_phong));
    setCheckActionLoading(false);

    if (thunk.fulfilled.match(result)) {
      setCheckConfirmAction(null);
      onUpdated?.();
      return;
    }

    setCheckConfirmAction(null);
  };

  if (!isOpen) return null;

  const canCancel = isAdmin && detail && !CANCEL_BLOCKED_STATUS.includes(detail.trang_thai);
  const isCancelled = detail && ['da_huy', 'tu_choi'].includes(detail.trang_thai);
  const refundInfo = detail?.thong_tin_hoan_tien;
  const refundBadge = getRefundBadgeMeta(refundInfo?.trang_thai_hoan);
  const refundPending = ['cho_xu_ly', 'dang_xu_ly'].includes(detail?.hoan_tien?.trang_thai);
  const showCheckInAction = !isAdmin && canPartnerCheckIn(detail);
  const showCheckOutAction = !isAdmin && canPartnerCheckOut(detail);

  const paymentMethod = detail
    ? (PHUONG_THUC[detail.phuong_thuc_tt] || detail.thanh_toan?.phuong_thuc || detail.phuong_thuc_tt || '—')
    : '—';

  const paymentRows = detail ? [{
    key: 'payment',
    cells: [
      formatCurrency(detail.thanh_toan_cuoi),
      <span className={`badge ${paymentInfo.badge}`}>{paymentInfo.label}</span>,
      paymentMethod,
    ],
    cellProps: [{ style: { fontWeight: 500 } }, {}, {}],
  }] : [];

  const nightlyRows = (detail?.chi_tiet_dat_phong || []).map((item) => ({
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
    <>
      {!isAdmin && (
        <PartnerBookingCheckConfirmModal
          booking={checkConfirmAction ? detail : null}
          action={checkConfirmAction}
          loading={checkActionLoading}
          onClose={handleCloseCheckConfirm}
          onConfirm={handleConfirmCheckAction}
        />
      )}

      <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box booking-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-modal-title"
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="booking-detail-modal-title">
              Chi tiết đặt phòng
            </h3>
            {detail?.ma_don_hang && (
              <p className="booking-detail-code">Mã đơn: {detail.ma_don_hang}</p>
            )}
          </div>
        </div>

        {(successMsg || error) && (
          <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 12 }}>
            {successMsg || error}
          </div>
        )}

        {detailLoading ? (
          <div className="booking-detail-modal-loading">Đang tải chi tiết đơn đặt phòng...</div>
        ) : !detail ? (
          <div className="booking-detail-modal-loading">Không tìm thấy đơn đặt phòng</div>
        ) : (
          <>
            <div className="booking-detail-status-bar">
              <div className="booking-detail-status-left">
                <span className={`badge ${bookingStatus.cls}`}>{bookingStatus.label}</span>
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

                {isAdmin && refundPending && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={refundLoading}
                    onClick={handleCompleteRefund}
                  >
                    {refundLoading ? 'Đang xử lý...' : 'Hoàn tất'}
                  </button>
                )}

                {showCheckInAction && (
                  <TableActions style={{ justifyContent: 'flex-end' }}>
                    <ActionButton variant="confirm" onClick={handleCheckInClick} disabled={loading || checkActionLoading}>
                      Xác nhận check-in
                    </ActionButton>
                  </TableActions>
                )}

                {showCheckOutAction && (
                  <TableActions style={{ justifyContent: 'flex-end' }}>
                    <ActionButton variant="confirm" onClick={handleCheckOutClick} disabled={loading || checkActionLoading}>
                      Xác nhận check-out
                    </ActionButton>
                  </TableActions>
                )}
              </div>
            </div>

            {cancelMode && (
              <div className="booking-reject-box">
                <p className="booking-reject-warning">
                  Hủy đơn sẽ cập nhật trạng thái đơn và thông báo cho khách hàng.
                  Vui lòng nhập lý do rõ ràng.
                </p>
                <label className="booking-reject-label">
                  Lý do hủy <span style={{ color: '#e05c5c' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="booking-reject-textarea"
                  placeholder="VD: Khách sạn không đủ điều kiện phục vụ..."
                  value={lyDo}
                  onChange={(e) => setLyDo(e.target.value)}
                />
                <div className="booking-reject-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={closeCancelBox}>
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

            {isCancelled && (refundInfo || getBookingCancelReason(detail)) && (
              <BookingCancelNotice refundInfo={refundInfo} booking={detail} />
            )}

            <div className="booking-detail-grid booking-detail-grid--modal">
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

            <div className="booking-detail-modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default BookingDetailModal;
