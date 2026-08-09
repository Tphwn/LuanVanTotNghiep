import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Loader2,
  Smartphone,
  Star,
  UserRound,
  Users,
  Wallet,
  Ticket,
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import BookingFlowStepper from '../../components/customer/BookingFlowStepper';
import ConfirmPaymentModal from '../../components/customer/ConfirmPaymentModal';
import CustomerLoadingState from '../../components/customer/CustomerLoadingState';
import PromoCodeModal from '../../components/customer/PromoCodeModal';
import LoginForPromoModal from '../../components/customer/LoginForPromoModal';
import Toast from '../../components/common/Toast';
import { useSelector } from 'react-redux';
import customerBookingService from '../../services/customerBookingService';
import guestBookingService, { guestPayTokenKey } from '../../services/guestBookingService';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { formatHotelTime } from '../../utils/bookingDisplay';
import formatCurrency from '../../utils/formatCurrency';
import { resolveUploadUrl } from '../../utils/media';
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
    desc: 'Chuyển đến cổng VNPay (ATM / thẻ)',
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

const fmtMoney = formatCurrency;
const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);

const hotelStars = (n) => Math.max(0, Math.min(5, Number(n) || 0));

const scoreOn10 = (avg5) => {
  const v = Number(avg5) || 0;
  return (Math.round(v * 2 * 10) / 10).toFixed(1);
};

const fmtStayLongDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const weekdays = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  return `${weekdays[dt.getDay()]}, ${dt.getDate()} tháng ${dt.getMonth() + 1} ${dt.getFullYear()}`;
};

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

const isSystemNote = (note) => {
  const t = String(note || '').trim();
  if (!t) return true;
  return t.startsWith('[Admin hủy]') || t.startsWith('[Hết hạn thanh toán]');
};

const resolvePaymentBackTo = (bookingId, locationState, isGuest) => {
  if (locationState?.backTo) return locationState.backTo;
  try {
    const stored = sessionStorage.getItem(`paymentBack:${bookingId}`);
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return isGuest ? ROUTES.CUSTOMER.GUEST_BOOKINGS : ROUTES.CUSTOMER.MY_BOOKINGS;
};

const readGuestPayToken = (bookingId) => {
  try {
    return sessionStorage.getItem(guestPayTokenKey(bookingId)) || '';
  } catch {
    return '';
  }
};

const CustomerPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useSelector((s) => s.auth);
  const bookingId = Number(id);
  const guestToken = readGuestPayToken(bookingId);
  const isGuest = Boolean(guestToken) || Boolean(location.state?.isGuest);
  const isCustomer = Boolean(token && user?.vai_tro === ROLES.KHACH_HANG);
  const backTo = resolvePaymentBackTo(bookingId, location.state, isGuest);

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
  const [method, setMethod] = useState('momo');
  const [remainingMs, setRemainingMs] = useState(PAY_WINDOW_MS);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showLoginForPromo, setShowLoginForPromo] = useState(false);
  const [pendingPromoCode, setPendingPromoCode] = useState('');
  const [claimingGuest, setClaimingGuest] = useState(false);
  const [eligiblePromos, setEligiblePromos] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [priceOpen, setPriceOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vnpayStatus = params.get('vnpay');
    if (!vnpayStatus) return;
    const message = params.get('message') || '';
    if (vnpayStatus === 'success') {
      setPaidSuccess(true);
      setToast({ message: message || 'Thanh toán VNPay thành công', type: 'success' });
    } else {
      setPayError(message || 'Thanh toán VNPay không thành công');
      setToast({ message: message || 'Thanh toán VNPay thất bại', type: 'error' });
    }
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, navigate]);

  useEffect(() => {
    if (!bookingId || Number.isNaN(bookingId)) {
      setLoading(false);
      setError('Mã đơn không hợp lệ');
      return;
    }
    if (!isCustomer && !guestToken) {
      setLoading(false);
      setError('Phiên thanh toán không hợp lệ. Vui lòng đặt lại phòng hoặc đăng nhập.');
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        if (isCustomer) {
          try {
            res = await customerBookingService.getBookingById(bookingId);
          } catch (err) {
            // Vừa login, đơn guest chưa claim — tạm dùng guest token
            if (guestToken && [403, 404].includes(err.response?.status)) {
              res = await guestBookingService.getBookingForPay(bookingId, guestToken);
            } else {
              throw err;
            }
          }
        } else {
          res = await guestBookingService.getBookingForPay(bookingId, guestToken);
        }
        const data = res.data?.data;
        if (!mounted) return;
        if (!data) {
          setError('Không tìm thấy đơn đặt phòng');
          setBooking(null);
          return;
        }
        if (data.thanh_toan?.trang_thai === 'da_thanh_toan') {
          setPaidSuccess(true);
          setBooking(data);
          setLoading(false);
          return;
        }
        // Thanh toán tại khách sạn — coi như đặt thành công
        if (
          !data.can_thanh_toan
          && data.thanh_toan?.phuong_thuc !== 'online'
          && ['da_xac_nhan', 'cho_xac_nhan'].includes(data.trang_thai)
        ) {
          setPaidSuccess(true);
          setBooking(data);
          setLoading(false);
          return;
        }
        if (!data.can_thanh_toan && data.thanh_toan?.trang_thai === 'cho_thanh_toan') {
          setError('Đơn đã hết hạn thanh toán (30 phút) và không còn trong danh sách đặt phòng của bạn.');
          setBooking(null);
          return;
        }
        setBooking(data);
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
  }, [bookingId, navigate, isCustomer, guestToken]);

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
  const hotel = booking?.khach_san;
  const stars = hotelStars(hotel?.so_sao);
  const checkInTime = formatHotelTime(hotel?.gio_nhan_phong, '14:00');
  const checkOutTime = formatHotelTime(hotel?.gio_tra_phong, '12:00');
  const specialNote = !isSystemNote(booking?.nguoi_dat?.ghi_chu)
    ? booking.nguoi_dat.ghi_chu.trim()
    : null;
  const guestCount = Number(booking?.luu_tru?.so_nguoi_lon) || 0;
  const roomCount = Math.max(Number(booking?.luu_tru?.so_phong) || 1, 1);
  const nights = Number(booking?.luu_tru?.so_dem) || 1;

  const stayLabel = useMemo(() => {
    if (!booking?.luu_tru) return '—';
    const { ngay_nhan, ngay_tra, so_dem } = booking.luu_tru;
    return `${fmtStayDate(ngay_nhan)} → ${fmtStayDate(ngay_tra)} · ${so_dem || 1} đêm`;
  }, [booking]);

  const loadEligiblePromos = async ({ asCustomer = false } = {}) => {
    if (!bookingId) return;
    setLoadingEligible(true);
    try {
      const useGuestList = !asCustomer && !isCustomer && guestToken;
      const res = useGuestList
        ? await guestBookingService.getEligiblePromotions(bookingId, guestToken)
        : await customerBookingService.getEligiblePromotions(bookingId);
      setEligiblePromos(res.data?.data || []);
    } catch {
      setEligiblePromos([]);
    } finally {
      setLoadingEligible(false);
    }
  };

  const openPromoModal = () => {
    if (!booking || expired) return;
    setPromoError('');
    setPromoSuccess('');
    setShowPromoModal(true);
    loadEligiblePromos();
  };

  const applyPromoAsCustomer = async (normalized) => {
    setApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');
    try {
      const res = await customerBookingService.applyPromo(bookingId, { ma_code: normalized });
      const data = res.data?.data;
      if (data) {
        setBooking(data);
        const nextCode = data.thanh_toan?.ma_khuyen_mai || normalized;
        setPromoSuccess(
          appliedCode && appliedCode !== nextCode
            ? `Đã đổi sang mã ${nextCode}`
            : `Đã áp mã ${nextCode}`,
        );
        setToast({ message: `Đã áp mã ${nextCode}`, type: 'success' });
        loadEligiblePromos();
      }
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Không thể áp mã khuyến mãi');
      setPromoSuccess('');
      setShowPromoModal(true);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleLoggedInForPromo = async () => {
    const codeToApply = String(pendingPromoCode || '').trim().toUpperCase();
    setClaimingGuest(true);
    try {
      if (bookingId && guestToken) {
        const res = await customerBookingService.claimGuestBooking(bookingId, guestToken);
        const data = res.data?.data;
        if (data) setBooking(data);
        try {
          sessionStorage.removeItem(guestPayTokenKey(bookingId));
        } catch {
          /* ignore */
        }
      }
      setShowLoginForPromo(false);
      setPendingPromoCode('');
      setToast({ message: 'Đăng nhập thành công.', type: 'success' });
      setShowPromoModal(true);
      await loadEligiblePromos({ asCustomer: true });
      if (codeToApply) {
        await applyPromoAsCustomer(codeToApply);
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Không gắn được đơn vào tài khoản. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setClaimingGuest(false);
    }
  };

  const handleApplyPromo = async (code) => {
    if (!booking || applyingPromo || expired) return;
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      setPromoSuccess('');
      return;
    }
    if (appliedCode && appliedCode === normalized) {
      setPromoError(`Mã ${appliedCode} đã được áp dụng cho đơn này`);
      setPromoSuccess('');
      return;
    }
    // Khách vãng lai: chọn mã bình thường; chỉ khi áp dụng mới yêu cầu đăng nhập
    if (!isCustomer) {
      setPendingPromoCode(normalized);
      setShowPromoModal(false);
      setShowLoginForPromo(true);
      return;
    }
    await applyPromoAsCustomer(normalized);
  };

  const handleRemovePromo = async () => {
    if (!booking || applyingPromo || expired || !appliedCode) return;
    if (!isCustomer) {
      setPendingPromoCode('');
      setShowPromoModal(false);
      setShowLoginForPromo(true);
      return;
    }
    setApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');
    try {
      const res = await customerBookingService.removePromo(bookingId);
      const data = res.data?.data;
      if (data) {
        setBooking(data);
        setPromoSuccess('Đã bỏ mã khuyến mãi');
        setToast({ message: 'Đã bỏ mã khuyến mãi', type: 'success' });
        loadEligiblePromos();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể bỏ mã khuyến mãi';
      setPromoError(msg);
      setToast({ message: msg, type: 'error' });
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
      // Sau claim đã xóa guest token → thanh toán qua API khách
      const useGuestApi = Boolean(guestToken && !isCustomer);
      if (method === 'vnpay') {
        const res = useGuestApi
          ? await guestBookingService.createVnpayPayment(bookingId, guestToken)
          : await customerBookingService.createVnpayPayment(bookingId);
        const paymentUrl = res.data?.data?.payment_url;
        if (!paymentUrl) {
          throw new Error('Không nhận được URL VNPay');
        }
        setShowConfirm(false);
        window.location.href = paymentUrl;
        return;
      }
      if (useGuestApi) {
        await guestBookingService.confirmPayment(bookingId, { cong_thanh_toan: method }, guestToken);
      } else {
        await customerBookingService.confirmPayment(bookingId, { cong_thanh_toan: method });
      }
      setShowConfirm(false);
      setPaidSuccess(true);
      setToast({ message: 'Thanh toán thành công', type: 'success' });
    } catch (err) {
      setPayError(err.response?.data?.message || err.message || 'Thanh toán không thành công');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-payment-page">
        <div className="booking-confirm-loading">
          <CustomerLoadingState message="Đang tải trang thanh toán..." />
        </div>
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
    const orderCode = booking.ma_don || booking.ma_don_hang || `#${booking.ma_dat_phong}`;
    const detailPath = isCustomer
      ? ROUTES.CUSTOMER.MY_BOOKING_DETAIL.replace(':id', bookingId)
      : ROUTES.CUSTOMER.GUEST_BOOKINGS;
    return (
      <div className="booking-payment-page">
        <Toast toast={toast} />
        <div className="booking-payment-thankyou">
          <div className="booking-payment-thankyou-icon" aria-hidden>
            <CheckCircle2 size={48} strokeWidth={1.75} />
          </div>
          <h1 className="booking-payment-thankyou-title">
            {booking.thanh_toan?.trang_thai === 'da_thanh_toan'
              ? 'Cảm ơn bạn đã thanh toán!'
              : 'Đặt phòng thành công!'}
          </h1>
          <p className="booking-payment-thankyou-desc">
            {booking.thanh_toan?.trang_thai === 'da_thanh_toan' ? (
              <>
                Thanh toán cho đơn
                {' '}
                <strong>{orderCode}</strong>
                {' '}
                tại
                {' '}
                <strong>{booking.khach_san?.ten || 'khách sạn'}</strong>
                {' '}
                đã hoàn tất. Chúng tôi đã ghi nhận đặt phòng của bạn.
              </>
            ) : (
              <>
                Đơn
                {' '}
                <strong>{orderCode}</strong>
                {' '}
                tại
                {' '}
                <strong>{booking.khach_san?.ten || 'khách sạn'}</strong>
                {' '}
                đã được ghi nhận.
              </>
            )}
          </p>

          <div className="booking-payment-thankyou-summary">
            <div>
              <span>Mã đặt phòng</span>
              <strong>{orderCode}</strong>
            </div>
            <div>
              <span>Khách sạn</span>
              <strong>{booking.khach_san?.ten || '—'}</strong>
            </div>
            <div>
              <span>Loại phòng</span>
              <strong>{booking.loai_phong?.ten_loai || '—'}</strong>
            </div>
            <div>
              <span>Ngày lưu trú</span>
              <strong>{stayLabel}</strong>
            </div>
            <div>
              <span>Số người ở</span>
              <strong>
                {guestCount}
                {' khách · '}
                {roomCount}
                {' phòng'}
              </strong>
            </div>
            <div>
              <span>Phương thức</span>
              <strong>
                {PAY_METHODS.find((m) => m.id === method)?.label
                  || (booking.thanh_toan?.phuong_thuc === 'online' ? 'Trực tuyến' : 'Tại khách sạn')
                  || method}
              </strong>
            </div>
            <div>
              <span>Tổng tiền</span>
              <strong>{fmtMoney(total)}</strong>
            </div>
          </div>

          <p className="booking-payment-thankyou-mail-note">
            Hệ thống đã ghi nhận đơn hàng. Nếu bạn không nhận được email xác nhận, vui lòng kiểm tra mục
            Thư rác (Spam) hoặc liên hệ Hotline
            {' '}
            <a href="tel:0777443088">0777443088</a>
            .
          </p>

          <div className="booking-payment-thankyou-actions">
            <Link to={detailPath} className="booking-payment-thankyou-primary">
              {isCustomer ? 'Xem chi tiết đơn' : 'Tra cứu đặt chỗ của tôi'}
            </Link>
            <Link to={ROUTES.HOME} className="booking-payment-thankyou-secondary">
              Về trang chủ
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
          <div className="booking-confirm-brand-bar">
            <Link to={ROUTES.HOME} className="booking-confirm-brand" aria-label="Trang chủ">
              <img
                src={resolveUploadUrl('/uploads/logo.png')}
                alt="Hotel Booking"
                className="booking-confirm-brand-logo"
              />
            </Link>
            <div className="booking-confirm-brand-divider" aria-hidden />
            <div className="booking-confirm-hotel-meta">
              <h1 className="booking-confirm-hotel-title">{hotel?.ten || 'Khách sạn'}</h1>
              <div className="booking-confirm-hotel-rating">
                {stars > 0 && (
                  <span className="booking-confirm-hotel-stars" aria-label={`${stars} sao`}>
                    {Array.from({ length: stars }, (_, i) => (
                      <Star key={i} size={14} fill="#f5b301" stroke="#f5b301" aria-hidden />
                    ))}
                  </span>
                )}
                {Number(hotel?.diem_trung_binh) > 0 && (
                  <strong className="booking-confirm-hotel-score">
                    {scoreOn10(hotel.diem_trung_binh)}
                    /10
                  </strong>
                )}
                {Number(hotel?.so_danh_gia) > 0 && (
                  <span className="booking-confirm-hotel-reviews">
                    (
                    {fmtNum(hotel.so_danh_gia)}
                    {' '}
                    đánh giá)
                  </span>
                )}
              </div>
            </div>
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

          <div className="booking-payment-promo-bar">
            <div className="booking-payment-promo-bar__left">
              <span className="booking-payment-promo-bar__icon" aria-hidden>
                <Ticket size={20} strokeWidth={2} />
              </span>
              <div>
                {appliedCode ? (
                  <>
                    <strong>
                      Đã áp dụng
                      {' '}
                      {appliedCode}
                    </strong>
                    <small>
                      {discount > 0
                        ? `Giảm ${fmtMoney(discount)}`
                        : (booking?.thanh_toan?.ten_khuyen_mai || 'Mã đã được áp dụng')}
                    </small>
                  </>
                ) : (
                  <>
                    <strong>Thêm mã giảm</strong>
                    <small>Nhập mã hoặc chọn mã khả dụng</small>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="booking-payment-promo-bar__action"
              onClick={openPromoModal}
              disabled={expired || applyingPromo}
            >
              {appliedCode ? 'Đổi mã' : 'Thêm mã'}
            </button>
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

          <div className="booking-payment-cta-card">
            <button
              type="button"
              className="booking-payment-cta-total"
              onClick={() => setPriceOpen((v) => !v)}
              aria-expanded={priceOpen}
            >
              <span className="booking-payment-cta-total-left">
                <strong>Tổng chi phí thanh toán</strong>
                <small>Bao gồm thuế bán hàng, phí dịch vụ và các loại thuế khác.</small>
              </span>
              <span className="booking-payment-cta-total-right">
                <strong>{fmtMoney(total)}</strong>
                <span className={`booking-payment-cta-chevron-wrap${priceOpen ? ' is-open' : ''}`}>
                  <ChevronDown size={16} strokeWidth={2.5} aria-hidden />
                </span>
              </span>
            </button>

            {priceOpen && (
              <div className="booking-payment-cta-breakdown">
                <div className="booking-payment-cta-breakdown-row">
                  <span>
                    {[hotel?.ten, booking?.loai_phong?.ten_loai].filter(Boolean).join(', ')
                      || 'Đặt phòng'}
                    {' - '}
                    {guestCount}
                    {' khách x '}
                    {roomCount}
                  </span>
                  <strong>{fmtMoney(subtotal)}</strong>
                </div>
                {discount > 0 && (
                  <div className="booking-payment-cta-breakdown-row booking-payment-cta-breakdown-row--discount">
                    <span>Giảm giá{appliedCode ? ` (${appliedCode})` : ''}</span>
                    <strong>
                      -
                      {fmtMoney(discount)}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <div className="booking-payment-cta-now">
              <span>Thanh toán ngay</span>
              <strong>{fmtMoney(total)}</strong>
            </div>

            <button
              type="button"
              className={`booking-payment-submit${paying ? ' is-loading' : ''}`}
              onClick={openConfirm}
              disabled={paying || expired}
              aria-busy={paying ? 'true' : undefined}
            >
              {paying ? (
                <>
                  <Loader2 className="customer-cta-spinner" size={18} strokeWidth={2.25} aria-hidden />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                `Thanh toán ${fmtMoney(total)}`
              )}
            </button>
          </div>
        </section>

        <aside className="booking-payment-aside">
          <div className="booking-payment-summary">
            <div className="booking-payment-summary-head">
              <span className="booking-payment-summary-icon" aria-hidden>
                <Building2 size={18} strokeWidth={2.25} />
              </span>
              <div>
                <h2 className="booking-payment-summary-title">Tóm tắt khách sạn</h2>
                <p className="booking-payment-summary-code">
                  Mã đặt chỗ
                  {' '}
                  {booking?.ma_don || booking?.ma_dat_phong || '—'}
                </p>
              </div>
            </div>

            <div className="booking-payment-summary-body">
              <p className="booking-payment-hotel">{hotel?.ten || '—'}</p>

              <div className="booking-payment-stay">
                <div className="booking-payment-stay-box">
                  <span className="booking-payment-stay-label">Nhận phòng</span>
                  <strong>{fmtStayLongDate(booking?.luu_tru?.ngay_nhan)}</strong>
                  <span className="booking-payment-stay-time">
                    Từ
                    {' '}
                    {checkInTime}
                  </span>
                </div>
                <div className="booking-payment-stay-mid" aria-hidden>
                  <span className="booking-payment-stay-nights">
                    {nights}
                    {' '}
                    đêm
                  </span>
                  <span className="booking-payment-stay-line" />
                </div>
                <div className="booking-payment-stay-box">
                  <span className="booking-payment-stay-label">Trả phòng</span>
                  <strong>{fmtStayLongDate(booking?.luu_tru?.ngay_tra)}</strong>
                  <span className="booking-payment-stay-time">
                    Trước
                    {' '}
                    {checkOutTime}
                  </span>
                </div>
              </div>

              <p className="booking-payment-pay-type">Thanh toán trực tuyến</p>

              <p className="booking-payment-room-line">
                (
                {roomCount}
                x)
                {' '}
                {booking?.loai_phong?.ten_loai || '—'}
              </p>

              <ul className="booking-payment-detail-list">
                <li>
                  <Users size={16} strokeWidth={2} aria-hidden />
                  <span>
                    {guestCount}
                    {' '}
                    khách
                  </span>
                </li>
                {booking?.loai_phong?.loai_giuong && (
                  <li>
                    <BedDouble size={16} strokeWidth={2} aria-hidden />
                    <span>{booking.loai_phong.loai_giuong}</span>
                  </li>
                )}
              </ul>

              <div className="booking-payment-meta-block">
                <span className="booking-payment-meta-label">Yêu cầu đặc biệt (nếu có)</span>
                <p className="booking-payment-meta-value">{specialNote || '—'}</p>
              </div>

              <div className="booking-payment-meta-block">
                <span className="booking-payment-meta-label">Tên khách</span>
                <p className="booking-payment-meta-value">{booking?.nguoi_dat?.ho_ten || '—'}</p>
              </div>

              <div className="booking-payment-contact">
                <h3 className="booking-payment-contact-title">Chi tiết người liên lạc</h3>
                <div className="booking-payment-contact-row">
                  <span className="booking-payment-contact-avatar" aria-hidden>
                    <UserRound size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <strong>{booking?.nguoi_dat?.ho_ten || '—'}</strong>
                    {booking?.nguoi_dat?.so_dien_thoai && (
                      <p>{booking.nguoi_dat.so_dien_thoai}</p>
                    )}
                    {booking?.nguoi_dat?.email && (
                      <p>{booking.nguoi_dat.email}</p>
                    )}
                  </div>
                </div>
              </div>
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

      <PromoCodeModal
        open={showPromoModal}
        totalPay={total}
        eligible={eligiblePromos}
        loadingList={loadingEligible}
        applying={applyingPromo}
        appliedCode={appliedCode}
        error={promoError}
        success={promoSuccess}
        onClose={() => {
          if (!applyingPromo) {
            setShowPromoModal(false);
            setPromoError('');
            setPromoSuccess('');
          }
        }}
        onApply={handleApplyPromo}
        onRemove={handleRemovePromo}
      />

      <LoginForPromoModal
        open={showLoginForPromo}
        returnPath={location.pathname}
        onClose={() => {
          if (!claimingGuest) {
            setShowLoginForPromo(false);
            setPendingPromoCode('');
          }
        }}
        onLoggedIn={handleLoggedInForPromo}
      />
    </div>
  );
};

export default CustomerPaymentPage;
