import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BookingCancelNotice from './BookingCancelNotice';
import {
  fetchAdminBookingDetail,
  cancelAdminBooking,
  fetchBookingStats,
  fetchAdminBookings,
  clearDetail as clearAdminDetail,
  clearMsg as clearAdminMsg,
} from '../../store/slices/adminBookingSlice';
import {
  fetchBookingDetail,
  checkInBooking,
  checkOutBooking,
  clearDetail as clearPartnerDetail,
  clearMsg as clearPartnerMsg,
} from '../../store/slices/partnerBookingSlice';
import PartnerBookingCheckConfirmModal from '../../pages/partner/bookings/components/PartnerBookingCheckConfirmModal';
import ReasonField from '../common/ReasonField';
import {
  TRANG_THAI,
  PHUONG_THUC,
  getPaymentDisplay,
  getRefundBadgeMeta,
  formatCurrency,
  formatHotelTime,
  diffDays,
  getBookingCancelReason,
  getBookingSpecialRequest,
  canPartnerCheckIn,
  canPartnerCheckOut,
} from '../../utils/bookingDisplay';

const CANCEL_BLOCKED_STATUS = ['hoan_thanh', 'da_huy', 'tu_choi', 'da_checkin'];

/** Ngày kiểu "17 thg 7, 2026" */
const formatShortViDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const DrawerField = ({ label, value }) => (
  <div className="booking-drawer-field">
    <span className="booking-drawer-field-label">{label}</span>
    <span className="booking-drawer-field-value">{value ?? '—'}</span>
  </div>
);

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
  const [cancelError, setCancelError] = useState('');
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

  const closeCancelBox = () => {
    setCancelMode(false);
    setLyDo('');
    setCancelError('');
  };

  const handleCancelBooking = async () => {
    if (!detail) return;
    if (!lyDo.trim()) {
      setCancelError('Phải kèm lý do mới được hủy');
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
  const refundAmount = Number(refundInfo?.so_tien_hoan) || 0;
  const refundBadge = refundAmount > 0
    ? getRefundBadgeMeta(refundInfo?.trang_thai_hoan)
    : null;
  const showCheckInAction = !isAdmin && canPartnerCheckIn(detail);
  const showCheckOutAction = !isAdmin && canPartnerCheckOut(detail);
  const hasPartnerAction = showCheckInAction || showCheckOutAction;

  const paymentMethod = detail
    ? (PHUONG_THUC[detail.phuong_thuc_tt] || detail.thanh_toan?.phuong_thuc || detail.phuong_thuc_tt || '—')
    : '—';

  const hotel = detail?.loai_phong?.khach_san;
  const nights = detail ? diffDays(detail.ngay_nhan_phong, detail.ngay_tra_phong) : 0;
  const checkInTime = formatHotelTime(hotel?.gio_nhan_phong, '14:00');
  const roomLabel = detail?.loai_phong?.ten_loai
    ? `${detail.loai_phong.ten_loai} · ${detail.so_phong || 1} phòng`
    : '—';
  const stayRange = detail
    ? `${formatShortViDate(detail.ngay_nhan_phong)} → ${formatShortViDate(detail.ngay_tra_phong)}`
    : '—';

  const toastNode = (successMsg || error) && (
    <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 12 }}>
      {successMsg || error}
    </div>
  );

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

      <div
        className="booking-drawer-overlay"
        onClick={onClose}
        role="presentation"
      >
        <aside
          className="booking-drawer"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-drawer-title"
        >
          <div className="booking-drawer-header">
            <div>
              <h3 className="booking-drawer-title" id="booking-drawer-title">
                Chi tiết đơn
              </h3>
              {detail?.ma_don_hang && (
                <p className="booking-drawer-id">{detail.ma_don_hang}</p>
              )}
            </div>
            <button type="button" className="booking-drawer-close" onClick={onClose} aria-label="Đóng">
              ×
            </button>
          </div>

          <div className="booking-drawer-body">
            {toastNode}

            {detailLoading ? (
              <div className="booking-detail-modal-loading">Đang tải chi tiết đơn đặt phòng...</div>
            ) : !detail ? (
              <div className="booking-detail-modal-loading">Không tìm thấy đơn đặt phòng</div>
            ) : (
              <>
                <div className="booking-drawer-hotel">
                  <h4 className="booking-drawer-hotel-name">{hotel?.ten || '—'}</h4>
                  {isAdmin && hotel?.doi_tac?.ten_cong_ty && (
                    <p className="booking-drawer-partner">{hotel.doi_tac.ten_cong_ty}</p>
                  )}
                  <div className="booking-drawer-badges">
                    <span className={`badge ${bookingStatus.cls}`}>{bookingStatus.label}</span>
                    <span className={`badge ${paymentInfo.badge}`}>{paymentInfo.label}</span>
                    {isCancelled && refundBadge && refundBadge.label !== paymentInfo.label && (
                      <span className={`badge ${refundBadge.cls}`}>{refundBadge.label}</span>
                    )}
                  </div>
                </div>

                {isAdmin && cancelMode && (
                  <div className="booking-reject-box">
                    <p className="booking-reject-warning">
                      Hủy đơn sẽ cập nhật trạng thái đơn và thông báo cho khách hàng.
                      Vui lòng nhập lý do rõ ràng.
                    </p>
                    <ReasonField
                      id="modal-booking-cancel-reason"
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

                <section className="booking-drawer-section">
                  <h5 className="booking-drawer-section-title">Khách nhận phòng</h5>
                  <DrawerField label="Họ tên" value={detail.ten_nguoi_nhan || detail.khach_hang?.ho_ten} />
                  <DrawerField
                    label="Điện thoại"
                    value={detail.sdt_nguoi_nhan || detail.khach_hang?.nguoi_dung?.so_dien_thoai}
                  />
                  <DrawerField label="Email" value={detail.khach_hang?.nguoi_dung?.email} />
                  <DrawerField label="Yêu cầu đặc biệt" value={getBookingSpecialRequest(detail) || '—'} />
                </section>

                <section className="booking-drawer-section">
                  <h5 className="booking-drawer-section-title">Lưu trú</h5>
                  <DrawerField label="Loại phòng" value={roomLabel} />
                  <DrawerField label="Nhận / Trả" value={stayRange} />
                  <DrawerField label="Số đêm" value={`${nights} đêm`} />
                  <DrawerField label="Giờ nhận dự kiến" value={checkInTime} />
                  <DrawerField label="Số khách" value={`${detail.so_khach || 0} khách`} />
                </section>

                <section className="booking-drawer-section">
                  <h5 className="booking-drawer-section-title">Thanh toán</h5>
                  <div className="booking-drawer-payment-row">
                    <span className="booking-drawer-payment-date">
                      {formatShortViDate(detail.ngay_dat || detail.thanh_toan?.ngay_thanh_toan)}
                    </span>
                    <strong className="booking-drawer-payment-amount">
                      {formatCurrency(detail.thanh_toan_cuoi)}
                    </strong>
                  </div>
                  <DrawerField label="Phương thức" value={paymentMethod} />
                </section>
              </>
            )}
          </div>

          {detail && !detailLoading && (
            <div className="booking-drawer-footer">
              {isAdmin && canCancel && !cancelMode && (
                <button
                  type="button"
                  className="btn btn-danger booking-drawer-footer-btn"
                  onClick={() => setCancelMode(true)}
                >
                  Hủy đơn
                </button>
              )}

              {showCheckInAction && (
                <button
                  type="button"
                  className="btn btn-primary booking-drawer-footer-btn"
                  disabled={loading || checkActionLoading}
                  onClick={handleCheckInClick}
                >
                  Xác nhận check-in
                </button>
              )}

              {showCheckOutAction && (
                <button
                  type="button"
                  className="btn btn-primary booking-drawer-footer-btn"
                  disabled={loading || checkActionLoading}
                  onClick={handleCheckOutClick}
                >
                  Xác nhận check-out
                </button>
              )}

              <button
                type="button"
                className={`btn booking-drawer-footer-btn ${
                  (isAdmin && canCancel && !cancelMode) || hasPartnerAction
                    ? 'btn-ghost'
                    : 'btn-primary'
                }`}
                onClick={onClose}
              >
                Đóng
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
};

export default BookingDetailModal;
