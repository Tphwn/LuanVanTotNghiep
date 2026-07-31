import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  HelpCircle,
  Ban,
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CancelBookingModal from '../../components/customer/CancelBookingModal';
import customerBookingService from '../../services/customerBookingService';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { formatHotelTime } from '../../utils/bookingDisplay';
import '../../assets/styles/home.css';

const STEPS = [
  { id: 1, title: 'Đã tạo đặt chỗ' },
  { id: 2, title: 'Đã chọn phương thức thanh toán' },
  { id: 3, title: 'Đang xử lý thanh toán' },
  { id: 4, title: 'Thanh toán thành công' },
];

const fmtMoney = (v) => `${new Intl.NumberFormat('vi-VN').format(Number(v) || 0)} VND`;

const fmtDateSlash = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${dt.getFullYear()}`;
};

const formatCountdownParts = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h} : ${m} : ${s}`;
};

const TransactionDetailPage = () => {
  const { id } = useParams();
  const bookingId = Number(id);
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceOpen, setPriceOpen] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (!token || !bookingId || Number.isNaN(bookingId)) {
      setLoading(false);
      setError('Mã giao dịch không hợp lệ');
      return;
    }
    let mounted = true;
    setLoading(true);
    customerBookingService.getBookingById(bookingId)
      .then((res) => {
        if (!mounted) return;
        const data = res.data?.data;
        if (!data) {
          setError('Không tìm thấy giao dịch');
          setBooking(null);
          return;
        }
        setBooking(data);
        if (data.han_thanh_toan) {
          setRemainingMs(Math.max(0, new Date(data.han_thanh_toan).getTime() - Date.now()));
        }
      })
      .catch((err) => {
        if (mounted) {
          setBooking(null);
          setError(err.response?.data?.message || 'Không thể tải chi tiết giao dịch');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [token, bookingId]);

  useEffect(() => {
    if (!booking?.can_thanh_toan) return undefined;
    const t = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [booking?.can_thanh_toan]);

  const currentStep = Number(booking?.buoc_giao_dich) || 1;
  const total = Number(booking?.thanh_toan?.tong_tien) || 0;
  const subtotal = Number(booking?.thanh_toan?.tam_tinh) || 0;
  const discount = Number(booking?.thanh_toan?.giam_gia) || 0;
  const isCancelled = booking?.trang_thai === 'da_huy' || booking?.trang_thai === 'tu_choi';
  const checkInTime = formatHotelTime(booking?.khach_san?.gio_nhan_phong, '14:00');
  const checkOutTime = formatHotelTime(booking?.khach_san?.gio_tra_phong, '12:00');
  const roomName = booking?.loai_phong?.ten_loai || '';

  if (!token) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (loading) {
    return (
      <div className="tx-detail-page">
        <div className="booking-confirm-loading">Đang tải chi tiết giao dịch...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="tx-detail-page">
        <div className="booking-confirm-error-card">
          <p>{error || 'Không tìm thấy giao dịch'}</p>
          <BackButton to={ROUTES.CUSTOMER.TRANSACTIONS} variant="outline" />
        </div>
      </div>
    );
  }

  const stepTitle = currentStep >= 4
    ? 'Thanh toán thành công'
    : currentStep === 3
      ? 'Đang xử lý thanh toán'
      : currentStep === 2
        ? 'Đã chọn phương thức thanh toán'
        : 'Đã tạo đặt chỗ';

  return (
    <div className="tx-detail-page">
      <div className="tx-detail-top">
        <BackButton to={ROUTES.CUSTOMER.TRANSACTIONS} label="Quay lại" />
        <div className="tx-detail-top-row">
          <h1 className="tx-detail-title">Chi tiết giao dịch của bạn</h1>
          <span className="tx-detail-id">
            ID đặt chỗ:
            {' '}
            {booking.ma_don || booking.ma_dat_phong}
          </span>
        </div>
      </div>

      <div className="tx-detail-hotel-card">
        <span className="tx-detail-hotel-icon" aria-hidden>
          <Building2 size={18} strokeWidth={2.25} />
        </span>
        <div className="tx-detail-hotel-body">
          <strong className="tx-detail-hotel-name">{booking.khach_san?.ten || '—'}</strong>
          {roomName && <p className="tx-detail-room-name">{roomName}</p>}
          <p className="tx-detail-stay-range">
            Nhận phòng:
            {' '}
            <strong>{fmtDateSlash(booking.luu_tru?.ngay_nhan)}</strong>
            {' — '}
            Trả phòng:
            {' '}
            <strong>{fmtDateSlash(booking.luu_tru?.ngay_tra)}</strong>
          </p>
          <p className="tx-detail-checkin">
            Nhận phòng từ
            {' '}
            {checkInTime}
            {' · '}
            Trả phòng trước
            {' '}
            {checkOutTime}
          </p>
        </div>
      </div>

      <section className="tx-detail-progress-card">
        <h2 className="tx-detail-progress-title">{stepTitle}</h2>
        {booking.can_thanh_toan && (
          <p className="tx-detail-timer-row">
            Thời gian còn lại:
            <span className="tx-detail-timer-pill">
              <Clock size={14} strokeWidth={2.25} aria-hidden />
              {formatCountdownParts(remainingMs)}
            </span>
          </p>
        )}

        <ol className="tx-stepper">
          {STEPS.map((step) => {
            const done = currentStep > step.id || (currentStep === 4 && step.id === 4);
            const active = currentStep === step.id && currentStep < 4;
            const success = currentStep >= 4 && step.id === 4;
            return (
              <li
                key={step.id}
                className={`tx-step${done || success ? ' is-done' : ''}${active ? ' is-active' : ''}`}
              >
                <span className="tx-step-marker" aria-hidden>
                  {(done || success) ? <Check size={14} strokeWidth={2.5} /> : null}
                </span>
                <div className="tx-step-body">
                  <strong>{step.title}</strong>
                  {active && step.id === 2 && (
                    <>
                      <p>Chọn cách bạn muốn thanh toán để tiếp tục giữ chỗ.</p>
                      <Link
                        to={ROUTES.CUSTOMER.PAYMENT.replace(':id', booking.ma_dat_phong)}
                        state={{ backTo: ROUTES.CUSTOMER.TRANSACTION_DETAIL.replace(':id', booking.ma_dat_phong) }}
                        className="tx-step-cta"
                      >
                        Chọn phương thức
                      </Link>
                    </>
                  )}
                  {active && step.id === 3 && (
                    <>
                      <p>Hoàn tất thanh toán trong thời gian còn lại để giữ chỗ của bạn.</p>
                      <Link
                        to={ROUTES.CUSTOMER.PAYMENT.replace(':id', booking.ma_dat_phong)}
                        state={{ backTo: ROUTES.CUSTOMER.TRANSACTION_DETAIL.replace(':id', booking.ma_dat_phong) }}
                        className="tx-step-cta"
                      >
                        Thanh toán ngay
                      </Link>
                    </>
                  )}
                  {success && (
                    <p>Thanh toán đã được ghi nhận thành công.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="tx-detail-panel">
        <h2 className="tx-detail-panel-title">Chi tiết thanh toán</h2>
        <button
          type="button"
          className="tx-detail-price-toggle"
          onClick={() => setPriceOpen((v) => !v)}
          aria-expanded={priceOpen}
        >
          <span>Tổng giá tiền</span>
          <span className="tx-detail-price-toggle-right">
            <strong className="tx-detail-price-amount">{fmtMoney(total)}</strong>
            <ChevronDown
              size={16}
              className={`tx-detail-chevron${priceOpen ? ' is-open' : ''}`}
              aria-hidden
            />
          </span>
        </button>
        {priceOpen && (
          <div className="tx-detail-price-breakdown">
            <div>
              <span>Tạm tính</span>
              <strong>{fmtMoney(subtotal)}</strong>
            </div>
            {discount > 0 && (
              <div>
                <span>Giảm giá</span>
                <strong>
                  -
                  {fmtMoney(discount)}
                </strong>
              </div>
            )}
            <div>
              <span>Thanh toán ngay</span>
              <strong>{booking.can_thanh_toan ? fmtMoney(total) : (booking.thanh_toan?.trang_thai === 'da_thanh_toan' ? fmtMoney(total) : '0 VND')}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="tx-detail-panel">
        <h2 className="tx-detail-panel-title">Hỗ trợ đặt phòng</h2>
        <Link to={ROUTES.CUSTOMER.CONTACT} className="tx-detail-manage-row">
          <HelpCircle size={18} strokeWidth={2} aria-hidden />
          <span>Cần trợ giúp cho đơn đặt phòng này</span>
          <ChevronRight size={18} aria-hidden />
        </Link>
        {(booking.can_thanh_toan || booking.co_the_huy) && !isCancelled && (
          <button
            type="button"
            className="tx-detail-manage-row tx-detail-manage-row--danger"
            onClick={() => setCancelOpen(true)}
          >
            <Ban size={18} strokeWidth={2} aria-hidden />
            <span>Hủy đơn đặt phòng này</span>
            <ChevronRight size={18} aria-hidden />
          </button>
        )}
        {booking.can_thanh_toan && (
          <div className="tx-detail-info-banner">
            <CircleAlert size={16} strokeWidth={2} aria-hidden />
            <span>Nếu bạn hủy đơn này, các mã giảm giá đã sử dụng sẽ được hoàn lại.</span>
          </div>
        )}
      </section>

      {cancelOpen && (
        <CancelBookingModal
          booking={{
            ma_dat_phong: booking.ma_dat_phong,
            ma_don_hang: booking.ma_don,
            trang_thai: booking.trang_thai,
            can_thanh_toan: booking.can_thanh_toan,
            khach_san: booking.khach_san,
            thanh_toan_cuoi: total,
          }}
          variant={booking.can_thanh_toan ? 'payment' : 'booking'}
          onClose={() => setCancelOpen(false)}
          onConfirmed={() => {
            setCancelOpen(false);
            navigate(ROUTES.CUSTOMER.TRANSACTIONS, {
              state: { flash: 'Đã hủy giao dịch thành công' },
            });
          }}
        />
      )}
    </div>
  );
};

export default TransactionDetailPage;
