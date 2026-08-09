import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CancelBookingModal from '../../components/customer/CancelBookingModal';
import CustomerLoadingState from '../../components/customer/CustomerLoadingState';
import Toast from '../../components/common/Toast';
import guestBookingService, { GUEST_LOOKUP_TOKEN_KEY } from '../../services/guestBookingService';
import ROUTES from '../../constants/routes';
import { sanitizePhoneInput, validateEmail, validatePhone } from '../../utils/authValidation';
import {
  CUSTOMER_PAYMENT_STATUS,
  formatBookingDate,
} from '../../utils/bookingDisplay';
import formatCurrency from '../../utils/formatCurrency';
import '../../assets/styles/home.css';

const PAYMENT_METHOD_LABEL = {
  online: 'Trực tuyến',
  tai_khach_san: 'Tại khách sạn',
};

const fmtVnd = formatCurrency;

const getStatusTone = (status) => {
  if (status === 'da_huy' || status === 'tu_choi') return 'cancel';
  if (status === 'hoan_thanh') return 'done';
  if (status === 'da_checkin') return 'checkin';
  return 'pending';
};

const InfoField = ({ label, value }) => (
  <div className="booking-detail-field">
    <span className="booking-detail-field-label">{label}</span>
    <span className="booking-detail-field-value">{value ?? '—'}</span>
  </div>
);

let guestLookupPageMounts = 0;

const GuestBookingsPage = () => {
  const [step, setStep] = useState('form'); // form | otp | detail
  const [form, setForm] = useState({ ma_don_hang: '', email: '', so_dien_thoai: '' });
  const [otp, setOtp] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [otpLeft, setOtpLeft] = useState(60);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelVariant, setCancelVariant] = useState('booking');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    guestLookupPageMounts += 1;

    try {
      const saved = sessionStorage.getItem(GUEST_LOOKUP_TOKEN_KEY);
      if (saved) {
        setSessionToken(saved);
        setLoading(true);
        guestBookingService.getLookupBooking(saved)
          .then((res) => {
            setBooking(res.data?.data || null);
            setStep('detail');
          })
          .catch(() => {
            sessionStorage.removeItem(GUEST_LOOKUP_TOKEN_KEY);
          })
          .finally(() => setLoading(false));
      }
    } catch {
      /* ignore */
    }

    return () => {
      guestLookupPageMounts -= 1;
      setTimeout(() => {
        if (guestLookupPageMounts === 0) {
          try {
            sessionStorage.removeItem(GUEST_LOOKUP_TOKEN_KEY);
          } catch {
            /* ignore */
          }
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (step !== 'otp' || otpLeft <= 0) return undefined;
    const t = setInterval(() => setOtpLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step, otpLeft]);

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const emailErr = validateEmail(form.email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const phoneErr = validatePhone(form.so_dien_thoai);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    if (!form.ma_don_hang.trim()) {
      setError('Vui lòng nhập mã đặt chỗ');
      return;
    }

    setLoading(true);
    try {
      const res = await guestBookingService.requestLookupOtp({
        ma_don_hang: form.ma_don_hang.trim(),
        email: form.email.trim(),
        so_dien_thoai: form.so_dien_thoai.trim(),
      });
      setLookupId(res.data?.data?.lookup_id || '');
      setOtp('');
      setOtpLeft(60);
      setStep('otp');
      setInfo(res.data?.message || 'Đã gửi mã OTP tới email của bạn');
    } catch (err) {
      setError(err.response?.data?.message || 'Không tra cứu được đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await guestBookingService.verifyLookupOtp({
        lookup_id: lookupId,
        otp: otp.trim(),
      });
      const token = res.data?.data?.session_token;
      const detail = res.data?.data?.booking;
      if (!token || !detail) throw new Error('Xác minh thất bại');
      sessionStorage.setItem(GUEST_LOOKUP_TOKEN_KEY, token);
      setSessionToken(token);
      setBooking(detail);
      setStep('detail');
      setInfo('');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const resetLookup = () => {
    sessionStorage.removeItem(GUEST_LOOKUP_TOKEN_KEY);
    setSessionToken('');
    setBooking(null);
    setStep('form');
    setOtp('');
    setLookupId('');
    setError('');
    setInfo('');
    setCancelTarget(null);
    setCancelVariant('booking');
  };

  const fetchCancelPreview = useCallback(
    () => guestBookingService.getCancelPreview(sessionToken),
    [sessionToken],
  );

  const submitCancel = useCallback(
    async () => {
      try {
        return await guestBookingService.cancelBooking(sessionToken, 'Khách hủy đơn');
      } catch (err) {
        showToast(
          err.response?.data?.message || 'Hủy đơn thất bại. Vui lòng thử lại.',
          'error',
        );
        throw err;
      }
    },
    [sessionToken, showToast],
  );

  const handleCancelConfirmed = async (_updated, meta = {}) => {
    const successMsg = meta.successMessage || 'Đã hủy đơn đặt phòng thành công';
    setCancelTarget(null);
    setCancelVariant('booking');
    setError('');
    setInfo('');
    showToast(successMsg, 'success');
    setLoading(true);
    try {
      const res = await guestBookingService.getLookupBooking(sessionToken);
      setBooking(res.data?.data || null);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.data?.data?.an_khoi_danh_sach) {
        sessionStorage.removeItem(GUEST_LOOKUP_TOKEN_KEY);
        setSessionToken('');
        setBooking(null);
        setStep('form');
      } else {
        showToast(
          err.response?.data?.message || 'Không tải lại được đơn sau khi hủy',
          'error',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'detail' && booking && loading) {
    return (
      <div className="booking-detail-page guest-bookings-page guest-bookings-page--detail">
        <Toast toast={toast} />
        <div className="booking-detail-card booking-detail-card--state">
          <CustomerLoadingState message="Đang cập nhật đơn đặt chỗ..." />
        </div>
      </div>
    );
  }

  if (step === 'detail' && booking) {
    const { khach_san, loai_phong, luu_tru, nguoi_dat, thanh_toan } = booking;
    const statusTone = getStatusTone(booking.trang_thai);
    const isCancelled = booking.trang_thai === 'da_huy' || booking.trang_thai === 'tu_choi';
    const thueVat = Math.max(
      0,
      Number(thanh_toan?.tong_tien || 0) - Number(thanh_toan?.tam_tinh || 0) + Number(thanh_toan?.giam_gia || 0),
    );

    return (
      <div className="booking-detail-page guest-bookings-page guest-bookings-page--detail">
        <Toast toast={toast} />
        {info && <p className="guest-bookings-info guest-bookings-info--banner">{info}</p>}
        {error && <p className="guest-bookings-error guest-bookings-error--banner">{error}</p>}

        <div className="booking-detail-card">
          <div className="booking-detail-toolbar">
            <button
              type="button"
              className="booking-detail-back"
              onClick={resetLookup}
            >
              ← Tra cứu đơn khác
            </button>
            <div className="booking-detail-toolbar-right">
              {booking.ma_don && (
                <span className="booking-detail-order-id">
                  ID đặt chỗ:
                  {' '}
                  {booking.ma_don}
                </span>
              )}
              <span className={`my-booking-status my-booking-status--${statusTone}`}>
                {booking.trang_thai_label}
              </span>
            </div>
          </div>

          <section className="booking-detail-block">
            <h2 className="booking-detail-block-title">Thông tin khách hàng</h2>
            <div className="booking-detail-split">
              <div className="booking-detail-split-col">
                <InfoField label="Họ tên" value={nguoi_dat?.ho_ten} />
                <InfoField label="Đặt ngày" value={formatBookingDate(booking.ngay_dat)} />
                <InfoField label="Ghi chú" value={nguoi_dat?.ghi_chu || 'Không có'} />
              </div>
              <div className="booking-detail-split-col">
                <InfoField label="Số điện thoại" value={nguoi_dat?.so_dien_thoai} />
                <InfoField label="Email" value={nguoi_dat?.email} />
              </div>
            </div>
          </section>

          <section className="booking-detail-block">
            <h2 className="booking-detail-block-title">Thông tin đơn đặt</h2>
            <InfoField label="Khách sạn" value={khach_san?.ten} />
            <InfoField label="Loại phòng" value={loai_phong?.ten_loai} />
            <InfoField label="Địa chỉ" value={khach_san?.dia_chi} />

            <h3 className="booking-detail-cluster-title">Thông tin phòng</h3>
            <div className="booking-detail-split booking-detail-split--room">
              <div className="booking-detail-split-col">
                <InfoField label="Số giường" value={loai_phong?.loai_giuong} />
                <InfoField
                  label="Diện tích"
                  value={loai_phong?.dien_tich != null ? `${loai_phong.dien_tich}m2` : '—'}
                />
              </div>
              <div className="booking-detail-split-col">
                <InfoField
                  label="Sức chứa"
                  value={loai_phong?.suc_chua ? `${loai_phong.suc_chua} Khách` : '—'}
                />
                <InfoField label="Số phòng" value={luu_tru?.so_phong ?? 1} />
              </div>
            </div>

            <h3 className="booking-detail-cluster-title">Lịch trình</h3>
            <div className="booking-detail-split">
              <div className="booking-detail-split-col">
                <InfoField label="Ngày nhận phòng" value={formatBookingDate(luu_tru?.ngay_nhan)} />
              </div>
              <div className="booking-detail-split-col">
                <InfoField label="Ngày trả phòng" value={formatBookingDate(luu_tru?.ngay_tra)} />
              </div>
            </div>

            <h3 className="booking-detail-cluster-title">Khách lưu trú</h3>
            <div className="booking-detail-split">
              <div className="booking-detail-split-col">
                <InfoField label="Người lớn" value={luu_tru?.so_nguoi_lon ?? 0} />
              </div>
              <div className="booking-detail-split-col">
                <InfoField label="Trẻ em" value={luu_tru?.so_tre_em ?? 0} />
              </div>
            </div>
          </section>

          <section className="booking-detail-block booking-detail-block--payment">
            <h2 className="booking-detail-block-title">Chi tiết thanh toán</h2>
            <div className="booking-detail-split">
              <div className="booking-detail-split-col">
                <InfoField
                  label="Giá mỗi đêm"
                  value={thanh_toan?.gia_moi_dem != null ? fmtVnd(thanh_toan.gia_moi_dem) : '—'}
                />
                <InfoField
                  label="Giảm giá"
                  value={thanh_toan?.giam_gia != null ? fmtVnd(thanh_toan.giam_gia) : '—'}
                />
                <InfoField
                  label="Trạng thái thanh toán"
                  value={CUSTOMER_PAYMENT_STATUS[thanh_toan?.trang_thai] || thanh_toan?.trang_thai}
                />
              </div>
              <div className="booking-detail-split-col">
                <InfoField label="Số đêm ở" value={luu_tru?.so_dem ?? 0} />
                <InfoField label="Thuế & VAT" value={fmtVnd(thueVat)} />
                <InfoField
                  label="Phương thức thanh toán"
                  value={PAYMENT_METHOD_LABEL[thanh_toan?.phuong_thuc] || thanh_toan?.phuong_thuc}
                />
              </div>
            </div>
            {isCancelled && (
              <section className="booking-detail-block booking-detail-block--cancel">
                <h2 className="booking-detail-block-title">
                  {booking.huy_boi_admin ? 'Đơn bị admin hủy' : 'Thông tin hủy đơn'}
                </h2>
                {booking.ly_do_huy && (
                  <p className="booking-detail-cancel-reason">
                    <span className="booking-detail-cancel-reason-label">
                      {booking.huy_boi_admin ? 'Lý do admin hủy' : 'Lý do hủy'}
                      :
                    </span>
                    {' '}
                    {booking.ly_do_huy}
                  </p>
                )}
                {booking.tom_tat_hoan_tien && (
                  <p className="booking-detail-cancel-summary">{booking.tom_tat_hoan_tien}</p>
                )}
                {booking.hoan_tien?.trang_thai_label && (
                  <div className="booking-detail-cancel-status">
                    <span className="booking-detail-cancel-status-label">Trạng thái hoàn tiền</span>
                    <span className={`refund-status-badge refund-status-badge--${booking.hoan_tien.trang_thai || 'none'}`}>
                      {booking.hoan_tien.trang_thai_label}
                    </span>
                  </div>
                )}
              </section>
            )}
            {isCancelled ? (
              <div className="booking-detail-totals">
                <div className="booking-detail-total-row booking-detail-total-row--muted">
                  <span className="booking-detail-total-label">Tổng tiền đã thanh toán (Ban đầu)</span>
                  <strong className="booking-detail-total-amount booking-detail-total-amount--muted">
                    {thanh_toan?.tong_tien != null ? fmtVnd(thanh_toan.tong_tien) : '—'}
                  </strong>
                </div>
                {Number(booking.hoan_tien?.so_tien_hoan) > 0 && (
                  <div className="booking-detail-total-row booking-detail-total-row--refund">
                    <span className="booking-detail-total-label">Tổng tiền được hoàn trả</span>
                    <strong className="booking-detail-total-amount booking-detail-total-amount--refund">
                      {fmtVnd(booking.hoan_tien.so_tien_hoan)}
                    </strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="booking-detail-total-row">
                <span className="booking-detail-total-label">Tổng thanh toán</span>
                <strong className="booking-detail-total-amount">
                  {thanh_toan?.tong_tien != null ? fmtVnd(thanh_toan.tong_tien) : '—'}
                </strong>
              </div>
            )}
          </section>

          {!booking.can_thanh_toan && booking.co_the_huy && (
            <div className="booking-detail-actions">
              <button
                type="button"
                className="my-booking-cancel-btn"
                onClick={() => {
                  setCancelVariant('booking');
                  setCancelTarget(booking);
                }}
              >
                Hủy đơn
              </button>
            </div>
          )}

          {booking.can_thanh_toan && booking.co_the_huy && (
            <div className="booking-detail-actions">
              <button
                type="button"
                className="my-booking-cancel-btn"
                onClick={() => {
                  setCancelVariant('payment');
                  setCancelTarget(booking);
                }}
              >
                Hủy thanh toán
              </button>
            </div>
          )}

          <p className="guest-bookings-hint guest-bookings-hint--detail">
            Khách không đăng nhập không thể đánh giá đơn.
          </p>
        </div>

        {cancelTarget && (
          <CancelBookingModal
            booking={{
              ma_dat_phong: booking.ma_dat_phong,
              ma_don_hang: booking.ma_don,
              thanh_toan_cuoi: thanh_toan?.tong_tien,
            }}
            variant={cancelVariant}
            fetchPreview={fetchCancelPreview}
            submitCancel={submitCancel}
            onClose={() => {
              setCancelTarget(null);
              setCancelVariant('booking');
            }}
            onConfirmed={handleCancelConfirmed}
          />
        )}
      </div>
    );
  }

  return (
    <div className="guest-bookings-page">
      <Toast toast={toast} />
      <div className="guest-bookings-card">
        <h1 className="guest-bookings-title">Đặt chỗ của tôi</h1>

        {step === 'form' && (
          <>
            <p className="guest-bookings-desc">
              Nhập mã đặt chỗ cùng email và số điện thoại đã dùng lúc đặt phòng.
            </p>
            <form onSubmit={handleLookup} className="guest-bookings-form">
              <label className="guest-bookings-label" htmlFor="ma_don_hang">
                Mã đặt chỗ
              </label>
              <input
                id="ma_don_hang"
                className="guest-bookings-input"
                value={form.ma_don_hang}
                onChange={(e) => setForm((p) => ({ ...p, ma_don_hang: e.target.value.toUpperCase() }))}
                placeholder="Ví dụ: DH28640976417"
                required
              />
              <p className="guest-bookings-hint">Mã hiển thị sau khi thanh toán thành công.</p>

              <label className="guest-bookings-label" htmlFor="guest_email">Email</label>
              <input
                id="guest_email"
                type="email"
                className="guest-bookings-input"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />

              <label className="guest-bookings-label" htmlFor="guest_phone">Số điện thoại</label>
              <input
                id="guest_phone"
                className="guest-bookings-input"
                value={form.so_dien_thoai}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  so_dien_thoai: sanitizePhoneInput(e.target.value),
                }))}
                placeholder="0901234567"
                maxLength={10}
                required
              />

              {error && <p className="guest-bookings-error">{error}</p>}
              {info && <p className="guest-bookings-info">{info}</p>}

              <button type="submit" className="guest-bookings-submit" disabled={loading}>
                {loading ? 'Đang gửi OTP...' : 'Tra cứu'}
              </button>
            </form>
            <p className="guest-bookings-footer">
              Đã có tài khoản?
              {' '}
              <Link to={ROUTES.LOGIN} state={{ from: ROUTES.CUSTOMER.MY_BOOKINGS }}>
                Đăng nhập
              </Link>
              {' '}
              để xem tất cả đơn của bạn.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="guest-bookings-desc">
              Nhập mã OTP đã gửi tới email của bạn. Mã hết hạn sau {otpLeft}s.
            </p>
            <form onSubmit={handleVerifyOtp} className="guest-bookings-form">
              <label className="guest-bookings-label" htmlFor="otp">Mã OTP</label>
              <input
                id="otp"
                className="guest-bookings-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 chữ số"
                maxLength={6}
                required
              />
              {error && <p className="guest-bookings-error">{error}</p>}
              {info && <p className="guest-bookings-info">{info}</p>}
              <button type="submit" className="guest-bookings-submit" disabled={loading || otpLeft <= 0}>
                {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
              </button>
              <button type="button" className="guest-bookings-secondary-btn" onClick={resetLookup}>
                Quay lại tra cứu
              </button>
            </form>
          </>
        )}

        {loading && step === 'detail' && !booking && (
          <CustomerLoadingState compact message="Đang tải thông tin đặt chỗ..." />
        )}
      </div>
    </div>
  );
};

export default GuestBookingsPage;
