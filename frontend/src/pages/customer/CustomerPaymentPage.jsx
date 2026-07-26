import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Smartphone,
  UserRound,
  Wallet,
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import BookingFlowStepper from '../../components/customer/BookingFlowStepper';
import ConfirmPaymentModal from '../../components/customer/ConfirmPaymentModal';
import Toast from '../../components/common/Toast';
import customerBookingService from '../../services/customerBookingService';
import ROUTES from '../../constants/routes';
import '../../assets/styles/home.css';

const PAY_METHODS = [
  {
    id: 'momo',
    label: 'Ví MoMo',
    desc: 'Quét mã QR hoặc liên kết ví',
    Icon: Smartphone,
  },
  {
    id: 'vnpay',
    label: 'VNPay',
    desc: 'Thẻ ATM / Visa / Mastercard',
    Icon: Wallet,
  },
  {
    id: 'the_tin_dung',
    label: 'Thẻ tín dụng',
    desc: 'Thanh toán trực tuyến an toàn',
    Icon: CreditCard,
  },
];

const PAY_WINDOW_MS = 30 * 60 * 1000;

const fmtMoney = (v) => `${new Intl.NumberFormat('vi-VN').format(Number(v) || 0)}₫`;

const fmtStayDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const resolvePaymentBackTo = (bookingId, locationState) => {
  if (locationState?.backTo) return locationState.backTo;
  try {
    const stored = sessionStorage.getItem(`paymentBack:${bookingId}`);
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return ROUTES.CUSTOMER.MY_BOOKINGS;
};

const CustomerPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingId = Number(id);
  const backTo = resolvePaymentBackTo(bookingId, location.state);

  useEffect(() => {
    if (!bookingId || Number.isNaN(bookingId) || !location.state?.backTo) return;
    try {
      sessionStorage.setItem(`paymentBack:${bookingId}`, location.state.backTo);
    } catch {
      /* ignore */
    }
  }, [bookingId, location.state]);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [error, setError] = useState('');
  const [payError, setPayError] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [method, setMethod] = useState('momo');
  const [remainingMs, setRemainingMs] = useState(PAY_WINDOW_MS);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!bookingId || Number.isNaN(bookingId)) {
      setLoading(false);
      setError('Mã đơn không hợp lệ');
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await customerBookingService.getBookingById(bookingId);
        const data = res.data?.data;
        if (!mounted) return;
        if (!data) {
          setError('Không tìm thấy đơn đặt phòng');
          setBooking(null);
          return;
        }
        if (data.thanh_toan?.trang_thai === 'da_thanh_toan') {
          navigate(ROUTES.CUSTOMER.MY_BOOKING_DETAIL.replace(':id', bookingId), { replace: true });
          return;
        }
        if (!data.can_thanh_toan && data.thanh_toan?.trang_thai === 'cho_thanh_toan') {
          setError('Đơn đã hết hạn thanh toán (30 phút) và không còn trong danh sách đặt phòng của bạn.');
          setBooking(null);
          return;
        }
        setBooking(data);
        if (data.thanh_toan?.ma_khuyen_mai) {
          setPromoCode(data.thanh_toan.ma_khuyen_mai);
        }
        const deadline = data.han_thanh_toan
          ? new Date(data.han_thanh_toan).getTime()
          : (data.ngay_dat ? new Date(data.ngay_dat).getTime() + PAY_WINDOW_MS : Date.now() + PAY_WINDOW_MS);
        setRemainingMs(Math.max(0, deadline - Date.now()));
      } catch (err) {
        if (mounted) {
          setBooking(null);
          setError(err.response?.data?.message || 'Không thể tải thông tin thanh toán');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [bookingId, navigate]);

  useEffect(() => {
    if (!booking || paidSuccess) return undefined;
    const timer = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [booking, paidSuccess]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const subtotal = Number(booking?.thanh_toan?.tam_tinh) || 0;
  const discount = Number(booking?.thanh_toan?.giam_gia) || 0;
  const total = Number(booking?.thanh_toan?.tong_tien) || 0;
  const expired = remainingMs <= 0;
  const appliedCode = booking?.thanh_toan?.ma_khuyen_mai || '';

  const stayLabel = useMemo(() => {
    if (!booking?.luu_tru) return '—';
    const { ngay_nhan, ngay_tra, so_dem } = booking.luu_tru;
    return `${fmtStayDate(ngay_nhan)} → ${fmtStayDate(ngay_tra)} · ${so_dem || 1} đêm`;
  }, [booking]);

  const handleApplyPromo = async () => {
    if (!booking || applyingPromo || expired) return;
    const code = promoCode.trim();
    if (!code) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      setPromoSuccess('');
      return;
    }
    if (appliedCode && appliedCode === code.toUpperCase()) {
      setPromoError(`Mã ${appliedCode} đã được áp dụng cho đơn này`);
      setPromoSuccess('');
      return;
    }
    setApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');
    setError('');
    try {
      const res = await customerBookingService.applyPromo(bookingId, { ma_code: code });
      const data = res.data?.data;
      if (data) {
        setBooking(data);
        setPromoCode(data.thanh_toan?.ma_khuyen_mai || code.toUpperCase());
        setPromoSuccess(
          appliedCode && appliedCode !== code.toUpperCase()
            ? `Đã đổi sang mã ${data.thanh_toan?.ma_khuyen_mai || code.toUpperCase()}`
            : `Đã áp mã ${data.thanh_toan?.ma_khuyen_mai || code.toUpperCase()}`
        );
      }
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Không thể áp mã khuyến mãi');
    } finally {
      setApplyingPromo(false);
    }
  };

  const openConfirm = () => {
    if (!booking || paying || expired) return;
    setPayError('');
    setShowConfirm(true);
  };

  const handleConfirmPay = async () => {
    if (!booking || paying || expired) return;
    setPaying(true);
    setPayError('');
    try {
      await customerBookingService.confirmPayment(bookingId, { cong_thanh_toan: method });
      setShowConfirm(false);
      setPaidSuccess(true);
      setToast({ message: 'Thanh toán thành công', type: 'success' });
    } catch (err) {
      setPayError(err.response?.data?.message || 'Thanh toán không thành công');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-payment-page">
        <div className="booking-confirm-loading">Đang tải trang thanh toán...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="booking-payment-page">
        <div className="booking-confirm-error-card">
          <p>{error}</p>
          <BackButton to={ROUTES.CUSTOMER.MY_BOOKINGS} variant="outline" />
        </div>
      </div>
    );
  }

  if (paidSuccess && booking) {
    return (
      <div className="booking-payment-page">
        <Toast toast={toast} />
        <div className="booking-payment-thankyou">
          <div className="booking-payment-thankyou-icon" aria-hidden>
            <CheckCircle2 size={48} strokeWidth={1.75} />
          </div>
          <h1 className="booking-payment-thankyou-title">Cảm ơn bạn đã thanh toán!</h1>
          <p className="booking-payment-thankyou-desc">
            Thanh toán cho đơn
            {' '}
            <strong>{booking.ma_don || booking.ma_dat_phong}</strong>
            {' '}
            tại
            {' '}
            <strong>{booking.khach_san?.ten || 'khách sạn'}</strong>
            {' '}
            đã hoàn tất.
            Chúng tôi đã ghi nhận đặt phòng của bạn.
          </p>

          <div className="booking-payment-thankyou-summary">
            <div>
              <span>Số tiền đã thanh toán</span>
              <strong>{fmtMoney(total)}</strong>
            </div>
            <div>
              <span>Phương thức</span>
              <strong>
                {PAY_METHODS.find((m) => m.id === method)?.label || method}
              </strong>
            </div>
            <div>
              <span>Thời gian lưu trú</span>
              <strong>{stayLabel}</strong>
            </div>
          </div>

          <div className="booking-payment-thankyou-actions">
            <Link
              to={ROUTES.CUSTOMER.MY_BOOKING_DETAIL.replace(':id', bookingId)}
              className="booking-payment-thankyou-primary"
            >
              Xem chi tiết đơn
            </Link>
            <Link
              to={ROUTES.CUSTOMER.MY_BOOKINGS}
              className="booking-payment-thankyou-secondary"
            >
              Về đặt chỗ của tôi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-payment-page">
      <Toast toast={toast} />
      <div className="booking-confirm-header">
        <BackButton
          to={backTo}
          className="booking-confirm-back page-back-btn--standalone"
          label="Quay lại"
        />
        <div className="booking-confirm-header-row">
          <div>
            <h1 className="booking-confirm-title">Thanh toán</h1>
            <p className="booking-payment-step-hint">Bước 2/2 · Chọn phương thức và hoàn tất</p>
          </div>
          <BookingFlowStepper current={2} />
        </div>
      </div>

      <div className="booking-payment-layout">
        <section className="booking-payment-main">
          <div className="booking-payment-banner">
            <span>Đừng lo lắng, giá vẫn giữ nguyên. Hãy hoàn tất thanh toán của bạn</span>
            <span className={`booking-payment-timer${expired ? ' is-expired' : ''}`}>
              <Clock size={16} strokeWidth={2.25} aria-hidden />
              {expired ? 'Hết hạn' : formatCountdown(remainingMs)}
            </span>
          </div>

          <div className="booking-payment-promo">
            <label className="booking-payment-promo-label" htmlFor="promo_code">
              Mã khuyến mãi
            </label>
            <div className="booking-payment-promo-row">
              <input
                id="promo_code"
                className="booking-payment-promo-input"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                  setPromoSuccess('');
                }}
                placeholder="Nhập mã khuyến mãi"
                disabled={expired || applyingPromo}
                maxLength={40}
              />
              <button
                type="button"
                className="booking-payment-promo-btn"
                onClick={handleApplyPromo}
                disabled={expired || applyingPromo || !promoCode.trim()}
              >
               {applyingPromo ? 'Đang áp...' : 'Áp dụng'}
              </button>
            </div>
            {appliedCode && !promoError && (
              <p className="booking-payment-promo-applied">
                Đang áp dụng:
                {' '}
                <strong>{appliedCode}</strong>
                {booking?.thanh_toan?.ten_khuyen_mai
                  ? ` — ${booking.thanh_toan.ten_khuyen_mai}`
                  : ''}
                {' '}
                (có thể đổi mã trước khi thanh toán)
              </p>
            )}
            {promoSuccess && <p className="booking-payment-promo-ok">{promoSuccess}</p>}
            {promoError && <p className="booking-confirm-error">{promoError}</p>}
          </div>

          <h2 className="booking-payment-question">Bạn muốn thanh toán thế nào?</h2>

          <div className="booking-payment-methods" role="radiogroup" aria-label="Phương thức thanh toán">
            {PAY_METHODS.map(({ id: methodId, label, desc, Icon }) => {
              const selected = method === methodId;
              return (
                <label
                  key={methodId}
                  className={`booking-payment-method${selected ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="pay_method"
                    value={methodId}
                    checked={selected}
                    onChange={() => setMethod(methodId)}
                  />
                  <span className="booking-payment-method-radio" aria-hidden />
                  <span className="booking-payment-method-icon">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <span className="booking-payment-method-text">
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </span>
                </label>
              );
            })}
          </div>

          {error && <p className="booking-confirm-error">{error}</p>}
          {expired && (
            <p className="booking-confirm-error">
              Phiên thanh toán đã hết hạn.
              {' '}
              <Link to={ROUTES.CUSTOMER.MY_BOOKINGS}>Xem đơn của tôi</Link>
            </p>
          )}

          <button
            type="button"
            className="booking-payment-submit"
            onClick={openConfirm}
            disabled={paying || expired}
          >
            {`Thanh toán ${fmtMoney(total)}`}
          </button>
        </section>

        <aside className="booking-payment-aside">
          <div className="booking-payment-summary">
            <h2 className="booking-confirm-section-title">Thông tin đặt phòng</h2>
            <p className="booking-payment-hotel">{booking?.khach_san?.ten || '—'}</p>
            <p className="booking-payment-order">
              Mã đơn:
              {' '}
              <strong>{booking?.ma_don || booking?.ma_dat_phong}</strong>
            </p>

            <ul className="booking-payment-info-list">
              <li>
                <BedDouble size={16} strokeWidth={2} aria-hidden />
                <span>
                  Loại phòng:
                  {' '}
                  {booking?.loai_phong?.ten_loai || '—'}
                  {' · '}
                  {booking?.luu_tru?.so_phong || 1}
                  {' phòng'}
                </span>
              </li>
              <li>
                <CalendarDays size={16} strokeWidth={2} aria-hidden />
                <span>
                  Thời gian lưu trú:
                  {' '}
                  {stayLabel}
                </span>
              </li>
              <li>
                <UserRound size={16} strokeWidth={2} aria-hidden />
                <span>
                  Người nhận phòng:
                  {' '}
                  {booking?.nguoi_dat?.ho_ten || '—'}
                  {booking?.nguoi_dat?.so_dien_thoai
                    ? ` · ${booking.nguoi_dat.so_dien_thoai}`
                    : ''}
                </span>
              </li>
            </ul>

            <div className="booking-payment-price-rows">
              <div className="booking-payment-price-row">
                <span>Tạm tính</span>
                <strong>{fmtMoney(subtotal)}</strong>
              </div>
              {discount > 0 && (
                <div className="booking-payment-price-row booking-payment-price-row--discount">
                  <span>Giảm giá{appliedCode ? ` (${appliedCode})` : ''}</span>
                  <strong>
                    -
                    {fmtMoney(discount)}
                  </strong>
                </div>
              )}
            </div>

            <div className="booking-payment-total">
              <span>Thanh toán</span>
              <strong>{fmtMoney(total)}</strong>
            </div>
          </div>
        </aside>
      </div>

      {showConfirm && (
        <ConfirmPaymentModal
          booking={booking}
          method={method}
          amount={total}
          submitting={paying}
          error={payError}
          onClose={() => {
            if (!paying) {
              setShowConfirm(false);
              setPayError('');
            }
          }}
          onConfirm={handleConfirmPay}
        />
      )}
    </div>
  );
};

export default CustomerPaymentPage;
