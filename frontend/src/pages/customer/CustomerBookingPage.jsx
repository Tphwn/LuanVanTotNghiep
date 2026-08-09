import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Star } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { useSelector } from 'react-redux';
import publicHotelService from '../../services/publicHotelService';
import customerBookingService from '../../services/customerBookingService';
import RoomSpecs from '../../components/customer/RoomSpecs';
import BookingFlowStepper from '../../components/customer/BookingFlowStepper';
import CustomerLoadingState from '../../components/customer/CustomerLoadingState';
import { formatBedLabel } from '../../utils/bedDisplay';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { resolveBookingQuery } from '../../utils/bookingNavigation';
import { formatHotelTime } from '../../utils/bookingDisplay';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import {
  buildAccommodationPolicyGroups,
  buildCancellationPolicyItems,
} from '../../utils/hotelPolicyUtils';
import { sanitizePhoneInput, validateEmail, validatePhone } from '../../utils/authValidation';
import guestBookingService, { guestPayTokenKey } from '../../services/guestBookingService';
import Toast from '../../components/common/Toast';
import '../../assets/styles/home.css';

const fmtShortDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

const hotelStars = (n) => Math.max(0, Math.min(5, Number(n) || 0));

const scoreOn10 = (avg5) => {
  const v = Number(avg5) || 0;
  return (Math.round(v * 2 * 10) / 10).toFixed(1);
};

const PolicyList = ({ items, variant }) => {
  if (!items?.length) return null;
  return (
    <ul className={`booking-confirm-policy-list booking-confirm-policy-list--${variant}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

const AccommodationPolicyDisplay = ({ groups }) => {
  if (!groups?.hasContent) return null;

  return (
    <div className="booking-confirm-accommodation">
      {groups.requirements.length > 0 && (
        <div className="booking-confirm-policy-requirements">
          <h4 className="booking-confirm-policy-subtitle">Yêu cầu khi nhận phòng</h4>
          <PolicyList items={groups.requirements} variant="neutral" />
        </div>
      )}

      <div className="booking-confirm-policy-cols">
        <div className="booking-confirm-policy-col booking-confirm-policy-col--allowed">
          <h4 className="booking-confirm-policy-subtitle">Được</h4>
          {groups.allowed.length > 0 ? (
            <PolicyList items={groups.allowed} variant="allowed" />
          ) : (
            <p className="booking-confirm-policy-none">Không có quy định đặc biệt</p>
          )}
        </div>

        <div className="booking-confirm-policy-col booking-confirm-policy-col--denied">
          <h4 className="booking-confirm-policy-subtitle">Không được</h4>
          {groups.notAllowed.length > 0 ? (
            <PolicyList items={groups.notAllowed} variant="denied" />
          ) : (
            <p className="booking-confirm-policy-none">Không có hạn chế</p>
          )}
        </div>
      </div>
    </div>
  );
};

const PolicyBox = ({ title, children, emptyText }) => {
  const hasContent = Boolean(children);
  return (
    <div className="booking-confirm-card booking-confirm-policy-card">
      <h2 className="booking-confirm-section-title">{title}</h2>
      <div className="booking-confirm-policy-body">
        {hasContent ? children : (
          <p className="booking-confirm-policy-empty">{emptyText}</p>
        )}
      </div>
    </div>
  );
};

const CustomerBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token } = useSelector((state) => state.auth);

  const bookingParams = useMemo(() => resolveBookingQuery({
    ma_khach_san: searchParams.get('ma_khach_san') || '',
    ma_loai_phong: searchParams.get('ma_loai_phong') || '',
    ngay_nhan: searchParams.get('ngay_nhan') || '',
    ngay_tra: searchParams.get('ngay_tra') || '',
    so_khach: searchParams.get('so_khach') || '',
    tre_em: searchParams.get('tre_em') || '',
    tuoi_tre_em: searchParams.get('tuoi_tre_em') || '',
    so_phong: searchParams.get('so_phong') || '',
    ma_dia_diem: searchParams.get('ma_dia_diem') || '',
  }), [searchParams]);

  const maKhachSan = bookingParams.ma_khach_san;
  const maLoaiPhong = bookingParams.ma_loai_phong;
  const ngayNhan = bookingParams.ngay_nhan;
  const ngayTra = bookingParams.ngay_tra;
  const soKhach = bookingParams.so_khach;
  const treEm = bookingParams.tre_em;
  const tuoiTreEm = bookingParams.tuoi_tre_em;
  const soPhong = bookingParams.so_phong;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    ten_nguoi_nhan: '',
    sdt_nguoi_nhan: '',
    email: '',
    phuong_thuc_tt: 'truc_tuyen',
    ghi_chu: '',
  });

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const updateForm = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
    if (error) setError('');
  };

  const roomQuery = useMemo(() => ({
    ngay_nhan: ngayNhan,
    ngay_tra: ngayTra,
    so_khach: soKhach,
    tre_em: treEm,
    so_phong: soPhong,
    tuoi_tre_em: tuoiTreEm,
  }), [ngayNhan, ngayTra, soKhach, treEm, soPhong, tuoiTreEm]);

  const hotelIdForBack = maKhachSan || room?.khach_san?.ma_khach_san || '';

  const fallbackBackUrl = useMemo(() => {
    if (!hotelIdForBack) return ROUTES.CUSTOMER.ROOM_SEARCH;
    const params = new URLSearchParams();
    if (searchParams.get('ma_dia_diem')) params.set('ma_dia_diem', searchParams.get('ma_dia_diem'));
    if (ngayNhan) params.set('ngay_nhan', ngayNhan);
    if (ngayTra) params.set('ngay_tra', ngayTra);
    if (soKhach) params.set('so_khach', soKhach);
    if (bookingParams.tre_em != null) params.set('tre_em', bookingParams.tre_em);
    if (bookingParams.tuoi_tre_em) params.set('tuoi_tre_em', bookingParams.tuoi_tre_em);
    if (bookingParams.so_phong) params.set('so_phong', bookingParams.so_phong);
    const qs = params.toString();
    return `/hotels/${hotelIdForBack}${qs ? `?${qs}` : ''}`;
  }, [
    hotelIdForBack,
    ngayNhan,
    ngayTra,
    soKhach,
    bookingParams.tre_em,
    bookingParams.tuoi_tre_em,
    bookingParams.so_phong,
    searchParams,
  ]);

  /** Ưu tiên trang vừa tới (chi tiết KS); không có thì về chi tiết KS theo ma_khach_san. */
  const handleBack = () => {
    const from = location.state?.from;
    if (
      typeof from === 'string'
      && from.startsWith('/')
      && !from.startsWith(`${ROUTES.CUSTOMER.BOOKING}`)
    ) {
      navigate(from);
      return;
    }
    navigate(fallbackBackUrl);
  };

  const nights = useMemo(() => {
    if (room?.so_dem) return room.so_dem;
    if (!ngayNhan || !ngayTra) return 1;
    const a = new Date(ngayNhan);
    const b = new Date(ngayTra);
    return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
  }, [ngayNhan, ngayTra, room?.so_dem]);

  const hotel = room?.khach_san;

  const accommodationPolicies = useMemo(
    () => buildAccommodationPolicyGroups(hotel),
    [hotel],
  );

  const cancellationPolicies = useMemo(
    () => buildCancellationPolicyItems(hotel),
    [hotel],
  );

  const roomCount = Math.max(Number(soPhong) || Number(room?.so_phong_dat) || 1, 1);
  const guestCount = Math.max(Number(soKhach) || 1, 1);

  const priceBreakdown = useMemo(() => {
    const invoice = room?.chi_tiet_gia;
    const vatRate = Number(invoice?.phan_tram_vat ?? hotel?.phan_tram_vat) || 10;
    const withVat = (amount) => Math.round(Math.max(Number(amount) || 0, 0) * (1 + vatRate / 100));

    if (invoice) {
      const tienPhong = Number(invoice.tien_phong) || 0;
      const phuThuTreEm = Number(invoice.phu_thu_tre_em) || 0;
      const tienGiam = Number(invoice.tien_giam) || 0;
      const thueVat = Number(invoice.thue_vat) || 0;
      const soDem = Math.max(Number(invoice.so_dem) || nights, 1);
      const soPhongInv = Math.max(Number(invoice.so_phong) || roomCount, 1);
      return {
        giaPhongDaVat: withVat(tienPhong),
        phuThuDaVat: withVat(phuThuTreEm),
        khuyenMaiDaVat: withVat(tienGiam),
        thueVat,
        phanTramVat: vatRate,
        total: Number(invoice.thanh_toan_cuoi) || Number(room?.tong_thanh_toan) || 0,
        soDem,
        soPhong: soPhongInv,
      };
    }
    const total = Number(room?.tong_thanh_toan) || Number(room?.tong_gia) || 0;
    return {
      giaPhongDaVat: total,
      phuThuDaVat: 0,
      khuyenMaiDaVat: 0,
      thueVat: 0,
      phanTramVat: vatRate,
      total,
      soDem: Math.max(nights, 1),
      soPhong: roomCount,
    };
  }, [room, nights, hotel?.phan_tram_vat, roomCount]);

  const isCustomer = Boolean(token && user?.vai_tro === ROLES.KHACH_HANG);
  const isGuest = !token;

  useEffect(() => {
    // Admin / đối tác không đặt phòng trên website khách
    if (token && user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (!maKhachSan || !maLoaiPhong) {
      setLoading(false);
      setError('Thiếu thông tin phòng. Vui lòng chọn lại phòng.');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicHotelService.getRoomById(maKhachSan, maLoaiPhong, roomQuery);
        setRoom(res.data?.data || null);
      } catch (err) {
        setRoom(null);
        setError(err.response?.data?.message || 'Không thể tải thông tin phòng');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [maKhachSan, maLoaiPhong, ngayNhan, ngayTra, roomQuery]);

  useEffect(() => {
    if (!isCustomer || !user) return;

    setForm((prev) => ({
      ...prev,
      ten_nguoi_nhan: prev.ten_nguoi_nhan || user.ho_ten || user.khach_hang?.ho_ten || '',
      sdt_nguoi_nhan: prev.sdt_nguoi_nhan || user.so_dien_thoai || '',
      email: user.email || prev.email || '',
    }));
  }, [user, isCustomer]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const validateGuestInfo = () => {
    const errors = {};
    const name = form.ten_nguoi_nhan.trim();
    if (!name) errors.ten_nguoi_nhan = 'Họ tên không được để trống.';
    else if (name.length < 2) errors.ten_nguoi_nhan = 'Họ tên phải có ít nhất 2 ký tự.';

    const phoneErr = validatePhone(form.sdt_nguoi_nhan);
    if (phoneErr) errors.sdt_nguoi_nhan = phoneErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setToast(null);

    const errors = validateGuestInfo();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const nothingFilled = !form.ten_nguoi_nhan.trim()
        && !form.sdt_nguoi_nhan.trim()
        && !form.email.trim();
      setToast({
        message: nothingFilled
          ? 'Vui lòng nhập đủ thông tin'
          : Object.values(errors)[0],
        type: 'error',
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        ma_loai_phong: Number(maLoaiPhong),
        ngay_nhan: ngayNhan,
        ngay_tra: ngayTra,
        so_khach: guestCount,
        so_phong: roomCount,
        tre_em: Number(treEm) || 0,
        tuoi_tre_em: tuoiTreEm
          ? String(tuoiTreEm).split(',').map((v) => Number(v.trim())).filter((n) => Number.isFinite(n))
          : [],
        ten_nguoi_nhan: form.ten_nguoi_nhan.trim(),
        sdt_nguoi_nhan: form.sdt_nguoi_nhan.trim(),
        email: form.email.trim(),
        phuong_thuc_tt: form.phuong_thuc_tt,
        ghi_chu: form.ghi_chu.trim() || undefined,
      };

      const res = isGuest
        ? await guestBookingService.createBooking(payload)
        : await customerBookingService.createBooking(payload);

      const data = res.data?.data;
      const bookingId = data?.ma_dat_phong;
      if (!bookingId) {
        throw new Error('Không nhận được mã đơn đặt phòng');
      }
      if (isGuest && data.guest_access_token) {
        try {
          sessionStorage.setItem(guestPayTokenKey(bookingId), data.guest_access_token);
        } catch {
          /* ignore */
        }
      }
      const confirmUrl = `${ROUTES.CUSTOMER.BOOKING}?${searchParams.toString()}`;
      const paymentUrl = ROUTES.CUSTOMER.PAYMENT.replace(':id', bookingId);
      try {
        sessionStorage.setItem(`paymentBack:${bookingId}`, confirmUrl);
      } catch {
        /* ignore */
      }
      navigate(paymentUrl, {
        state: {
          backTo: confirmUrl,
          isGuest: Boolean(isGuest || data.is_guest),
        },
      });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        setFieldErrors(apiErrors);
      }
      const msg = err.response?.data?.message || err.message || 'Không thể tiếp tục đặt phòng';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-confirm-page">
        <div className="booking-confirm-loading">
          <CustomerLoadingState message="Đang tải thông tin đặt phòng..." />
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="booking-confirm-page">
        <div className="booking-confirm-error-card">
          <p>{error}</p>
          <BackButton to={fallbackBackUrl} variant="outline" />
        </div>
      </div>
    );
  }

  const checkInTime = formatHotelTime(hotel?.gio_nhan_phong, '14:00');
  const checkOutTime = formatHotelTime(hotel?.gio_tra_phong, '12:00');
  const hasCancelRules = cancellationPolicies.rules.length > 0 || cancellationPolicies.notes.length > 0;

  return (
    <div className="booking-confirm-page">
      <Toast toast={toast} />
      <div className="booking-confirm-header">
        <BackButton onClick={handleBack} className="booking-confirm-back" />
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
                {hotelStars(hotel?.so_sao) > 0 && (
                  <span className="booking-confirm-hotel-stars" aria-label={`${hotelStars(hotel?.so_sao)} sao`}>
                    {Array.from({ length: hotelStars(hotel?.so_sao) }, (_, i) => (
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
                    {formatNumber(hotel.so_danh_gia)}
                    {' '}
                    đánh giá)
                  </span>
                )}
              </div>
            </div>
          </div>
          <BookingFlowStepper current={1} />
        </div>
      </div>

      <div className="booking-confirm-layout">
        <form
          id="booking-confirm-form"
          className="booking-confirm-main"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="booking-confirm-card">
            <h2 className="booking-confirm-page-title">Xác nhận đặt phòng</h2>
            <p className="booking-confirm-page-desc">
              {isGuest
                ? 'Nhập thông tin khách hàng và kiểm tra chính sách trước khi thanh toán'
                : 'Kiểm tra thông tin khách và chính sách trước khi thanh toán'}
            </p>

            {error && (
              <div className="booking-confirm-alert booking-confirm-alert--error" role="alert">
                {error}
              </div>
            )}

            <h3 className="booking-confirm-section-title">Thông tin khách hàng</h3>

            <div className="booking-confirm-field">
              <label className="booking-confirm-label" htmlFor="ten_nguoi_nhan">
                Họ tên <span className="booking-confirm-required">*</span>
              </label>
              <input
                id="ten_nguoi_nhan"
                className={`booking-confirm-input${fieldErrors.ten_nguoi_nhan ? ' is-invalid' : ''}`}
                value={form.ten_nguoi_nhan}
                onChange={(e) => updateForm('ten_nguoi_nhan', e.target.value)}
                maxLength={100}
                aria-invalid={Boolean(fieldErrors.ten_nguoi_nhan)}
              />
              {fieldErrors.ten_nguoi_nhan && (
                <p className="form-field-error" role="alert">{fieldErrors.ten_nguoi_nhan}</p>
              )}
            </div>

            <div className="booking-confirm-field-row">
              <div className="booking-confirm-field">
                <label className="booking-confirm-label" htmlFor="sdt_nguoi_nhan">
                  Số điện thoại <span className="booking-confirm-required">*</span>
                </label>
                <input
                  id="sdt_nguoi_nhan"
                  type="tel"
                  inputMode="numeric"
                  className={`booking-confirm-input${fieldErrors.sdt_nguoi_nhan ? ' is-invalid' : ''}`}
                  value={form.sdt_nguoi_nhan}
                  onChange={(e) => updateForm('sdt_nguoi_nhan', sanitizePhoneInput(e.target.value))}
                  maxLength={10}
                  placeholder="0901234567"
                  aria-invalid={Boolean(fieldErrors.sdt_nguoi_nhan)}
                />
                {fieldErrors.sdt_nguoi_nhan && (
                  <p className="form-field-error" role="alert">{fieldErrors.sdt_nguoi_nhan}</p>
                )}
              </div>
              <div className="booking-confirm-field">
                <label className="booking-confirm-label" htmlFor="email">
                  Email <span className="booking-confirm-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={`booking-confirm-input${fieldErrors.email ? ' is-invalid' : ''}`}
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  maxLength={100}
                  placeholder="email@domain.com"
                  readOnly={isCustomer}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && (
                  <p className="form-field-error" role="alert">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="booking-confirm-field">
              <label className="booking-confirm-label" htmlFor="ghi_chu">
                Ghi chú / yêu cầu đặc biệt
              </label>
              <textarea
                id="ghi_chu"
                className="booking-confirm-textarea"
                value={form.ghi_chu}
                onChange={(e) => updateForm('ghi_chu', e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="VD: Nhận phòng muộn, cần phòng tầng cao, thêm giường phụ..."
              />
            </div>
          </div>

          <PolicyBox
            title="Chính sách chỗ ở"
            emptyText="Khách sạn chưa cập nhật chính sách chỗ ở."
          >
            {accommodationPolicies?.hasContent ? (
              <AccommodationPolicyDisplay groups={accommodationPolicies} />
            ) : null}
          </PolicyBox>

          <PolicyBox
            title="Chính sách hủy"
            emptyText="Khách sạn chưa cấu hình chính sách hủy — hủy đặt phòng có thể mất 100% tiền cọc."
          >
            {hasCancelRules ? (
              <div className="booking-confirm-cancel-wrap">
                {cancellationPolicies.rules.length > 0 && (
                  <ul className="booking-confirm-policy-list">
                    {cancellationPolicies.rules.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {cancellationPolicies.notes.length > 0 && (
                  <ul className="booking-confirm-policy-notes">
                    {cancellationPolicies.notes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </PolicyBox>

        </form>

        <aside className="booking-confirm-aside">
          <div className="booking-confirm-card booking-confirm-summary">
            <h2 className="booking-confirm-section-title">Tóm tắt đặt phòng</h2>

            <p className="booking-confirm-hotel-name">
              Khách sạn: <strong>{hotel?.ten}</strong>
            </p>
            <p className="booking-confirm-room-name">
              Loại phòng: <strong>{room?.ten_loai}</strong>
            </p>

            {hotel?.dia_chi && (
              <p className="booking-confirm-address">
                <MapPin size={14} strokeWidth={2} aria-hidden />
                <span>{hotel.dia_chi}</span>
              </p>
            )}

            <div className="booking-confirm-stay-dates">
              <div className="booking-confirm-stay-col">
                <span className="booking-confirm-stay-label">NHẬN PHÒNG</span>
                <strong className="booking-confirm-stay-date">{fmtShortDate(ngayNhan)}</strong>
                <span className="booking-confirm-stay-time">Từ: {checkInTime}</span>
              </div>
              <div className="booking-confirm-stay-col">
                <span className="booking-confirm-stay-label">TRẢ PHÒNG</span>
                <strong className="booking-confirm-stay-date">{fmtShortDate(ngayTra)}</strong>
                <span className="booking-confirm-stay-time">Trước: {checkOutTime}</span>
              </div>
            </div>

            <p className="booking-confirm-party">
              <strong>{guestCount}</strong>
              {' khách · '}
              <strong>{roomCount}</strong>
              {' phòng'}
              {Number(treEm) > 0 ? ` · ${treEm} trẻ em` : ''}
            </p>

            <RoomSpecs
              sucChua={room?.suc_chua}
              dienTich={room?.dien_tich}
              soGiuong={room?.so_giuong}
              bedLabel={room?.loai_giuong || formatBedLabel(room || {})}
            />
          </div>

          <div className="booking-confirm-card booking-confirm-price">
            <h2 className="booking-confirm-section-title">Chi tiết giá</h2>
            <div className="booking-confirm-price-divider" aria-hidden />

            <div className="booking-confirm-price-row">
              <div>
                <span>
                  Giá phòng (
                  {priceBreakdown.soPhong}
                  {' '}
                  phòng x
                  {' '}
                  {priceBreakdown.soDem}
                  {' '}
                  đêm)
                </span>
                <span className="booking-confirm-price-sub-inline">
                  (Loại:
                  {' '}
                  {room?.ten_loai || '—'}
                  )
                </span>
              </div>
              <strong>{formatCurrency(priceBreakdown.giaPhongDaVat)}</strong>
            </div>

            <div className="booking-confirm-price-row">
              <span>Phụ thu trẻ em</span>
              <strong>{formatCurrency(priceBreakdown.phuThuDaVat)}</strong>
            </div>

            <div className="booking-confirm-price-row">
              <span>Khuyến mãi</span>
              <strong className={priceBreakdown.khuyenMaiDaVat > 0 ? 'is-discount' : undefined}>
                {priceBreakdown.khuyenMaiDaVat > 0 ? '-' : ''}
                {formatCurrency(priceBreakdown.khuyenMaiDaVat)}
              </strong>
            </div>

            <div className="booking-confirm-price-divider booking-confirm-price-divider--dashed" aria-hidden />

            <div className="booking-confirm-price-total booking-confirm-price-total--plain">
              <div>
                <span className="booking-confirm-price-total-label">Tổng thanh toán</span>
                {priceBreakdown.thueVat > 0 && (
                  <span className="booking-confirm-price-vat-note">
                    (Đã bao gồm VAT)
                  </span>
                )}
              </div>
              <strong className="booking-confirm-price-total-value">
                {formatCurrency(priceBreakdown.total)}
              </strong>
            </div>

            <button
              type="submit"
              form="booking-confirm-form"
              className={`booking-confirm-submit${submitting ? ' is-loading' : ''}`}
              disabled={submitting}
              aria-busy={submitting ? 'true' : undefined}
            >
              {submitting ? (
                <>
                  <Loader2 className="customer-cta-spinner" size={18} strokeWidth={2.25} aria-hidden />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                'Tiếp tục đặt phòng'
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CustomerBookingPage;
