import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { useSelector } from 'react-redux';
import publicHotelService from '../../services/publicHotelService';
import customerBookingService from '../../services/customerBookingService';
import RoomSpecs from '../../components/customer/RoomSpecs';
import BookingFlowStepper from '../../components/customer/BookingFlowStepper';
import { formatBedLabel } from '../../utils/bedDisplay';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { resolveBookingQuery } from '../../utils/bookingNavigation';
import { formatHotelTime } from '../../utils/bookingDisplay';
import {
  buildAccommodationPolicyGroups,
  buildCancellationPolicyItems,
} from '../../utils/hotelPolicyUtils';
import { sanitizePhoneInput } from '../../utils/authValidation';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);

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

  const [form, setForm] = useState({
    ten_nguoi_nhan: '',
    sdt_nguoi_nhan: '',
    email: '',
    phuong_thuc_tt: 'truc_tuyen',
    ghi_chu: '',
  });

  const roomQuery = useMemo(() => ({
    ngay_nhan: ngayNhan,
    ngay_tra: ngayTra,
    so_khach: soKhach,
    tre_em: treEm,
    so_phong: soPhong,
    tuoi_tre_em: tuoiTreEm,
  }), [ngayNhan, ngayTra, soKhach, treEm, soPhong, tuoiTreEm]);

  const backUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchParams.get('ma_dia_diem')) params.set('ma_dia_diem', searchParams.get('ma_dia_diem'));
    if (ngayNhan) params.set('ngay_nhan', ngayNhan);
    if (ngayTra) params.set('ngay_tra', ngayTra);
    if (soKhach) params.set('so_khach', soKhach);
    if (bookingParams.tre_em != null) params.set('tre_em', bookingParams.tre_em);
    if (bookingParams.tuoi_tre_em) params.set('tuoi_tre_em', bookingParams.tuoi_tre_em);
    if (bookingParams.so_phong) params.set('so_phong', bookingParams.so_phong);
    const qs = params.toString();
    return `/hotels/${maKhachSan}${qs ? `?${qs}` : ''}`;
  }, [maKhachSan, ngayNhan, ngayTra, soKhach, bookingParams.tre_em, bookingParams.tuoi_tre_em, bookingParams.so_phong, searchParams]);

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
    if (invoice) {
      const tienPhong = Number(invoice.tien_phong) || 0;
      const soDem = Math.max(Number(invoice.so_dem) || nights, 1);
      return {
        tienPhong,
        tienPhongMotDem: Math.round(tienPhong / soDem),
        phuThuTreEm: Number(invoice.phu_thu_tre_em) || 0,
        thueVat: Number(invoice.thue_vat) || 0,
        phanTramVat: Number(invoice.phan_tram_vat) || 0,
        total: Number(invoice.thanh_toan_cuoi) || Number(room?.tong_thanh_toan) || 0,
        soDem,
      };
    }
    const total = Number(room?.tong_thanh_toan) || Number(room?.tong_gia) || 0;
    const tienPhong = Number(room?.tong_gia) || total;
    const soDem = Math.max(nights, 1);
    return {
      tienPhong,
      tienPhongMotDem: Math.round(tienPhong / soDem),
      phuThuTreEm: 0,
      thueVat: 0,
      phanTramVat: Number(hotel?.phan_tram_vat) || 10,
      total,
      soDem,
    };
  }, [room, nights, hotel?.phan_tram_vat]);

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.LOGIN, { replace: true, state: { from: `${ROUTES.CUSTOMER.BOOKING}?${searchParams.toString()}` } });
      return;
    }
    if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [token, user, navigate, searchParams]);

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
    if (!user) return;

    setForm((prev) => ({
      ...prev,
      ten_nguoi_nhan: prev.ten_nguoi_nhan || user.ho_ten || user.khach_hang?.ho_ten || '',
      sdt_nguoi_nhan: prev.sdt_nguoi_nhan || user.so_dien_thoai || '',
      email: user.email || prev.email || '',
    }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await customerBookingService.createBooking({
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
      });

      const data = res.data?.data;
      const bookingId = data?.ma_dat_phong;
      if (!bookingId) {
        throw new Error('Không nhận được mã đơn đặt phòng');
      }
      const confirmUrl = `${ROUTES.CUSTOMER.BOOKING}?${searchParams.toString()}`;
      const paymentUrl = ROUTES.CUSTOMER.PAYMENT.replace(':id', bookingId);
      try {
        sessionStorage.setItem(`paymentBack:${bookingId}`, confirmUrl);
      } catch {
        /* ignore */
      }
      navigate(paymentUrl, { state: { backTo: confirmUrl } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tiếp tục đặt phòng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-confirm-page">
        <div className="booking-confirm-loading">Đang tải thông tin đặt phòng...</div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="booking-confirm-page">
        <div className="booking-confirm-error-card">
          <p>{error}</p>
          <BackButton to={ROUTES.CUSTOMER.HOTELS} variant="outline" />
        </div>
      </div>
    );
  }

  const checkInTime = formatHotelTime(hotel?.gio_nhan_phong, '14:00');
  const checkOutTime = formatHotelTime(hotel?.gio_tra_phong, '12:00');
  const hasCancelRules = cancellationPolicies.rules.length > 0 || cancellationPolicies.notes.length > 0;

  return (
    <div className="booking-confirm-page">
      <div className="booking-confirm-header">
        <BackButton to={backUrl} className="booking-confirm-back" />
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
                    {fmt(hotel.so_danh_gia)}
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
        <form id="booking-confirm-form" className="booking-confirm-main" onSubmit={handleSubmit}>
          <div className="booking-confirm-card">
            <h2 className="booking-confirm-page-title">Xác nhận đặt phòng</h2>
            <p className="booking-confirm-page-desc">
              Kiểm tra thông tin khách và chính sách trước khi thanh toán
            </p>

            <h3 className="booking-confirm-section-title">Thông tin khách hàng</h3>

            <div className="booking-confirm-field">
              <label className="booking-confirm-label" htmlFor="ten_nguoi_nhan">
                Họ tên <span className="booking-confirm-required">*</span>
              </label>
              <input
                id="ten_nguoi_nhan"
                className="booking-confirm-input"
                value={form.ten_nguoi_nhan}
                onChange={(e) => setForm((p) => ({ ...p, ten_nguoi_nhan: e.target.value }))}
                required
                maxLength={100}
              />
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
                  className="booking-confirm-input"
                  value={form.sdt_nguoi_nhan}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    sdt_nguoi_nhan: sanitizePhoneInput(e.target.value),
                  }))}
                  required
                  maxLength={10}
                />
              </div>
              <div className="booking-confirm-field">
                <label className="booking-confirm-label" htmlFor="email">
                  Email <span className="booking-confirm-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="booking-confirm-input"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  maxLength={100}
                  placeholder="email@domain.com"
                />
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
                onChange={(e) => setForm((p) => ({ ...p, ghi_chu: e.target.value }))}
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

          {error && room && (
            <p className="booking-confirm-error">{error}</p>
          )}
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

            <div className="booking-confirm-price-row">
              <span>Tiền phòng / đêm</span>
              <strong>
                {fmt(priceBreakdown.tienPhongMotDem)}
                {' '}
                đ
              </strong>
            </div>

            <div className="booking-confirm-price-row">
              <span>
                Giá phòng (
                {priceBreakdown.soDem}
                {' '}
                đêm)
              </span>
              <strong>
                {fmt(priceBreakdown.tienPhong)}
                {' '}
                đ
              </strong>
            </div>
            <div className="booking-confirm-price-sub">
              <span>
                (
                {roomCount}
                x)
                {' '}
                {room?.ten_loai}
                {' '}
                (
                {priceBreakdown.soDem}
                {' '}
                đêm)
              </span>
            </div>

            <div className="booking-confirm-price-row">
              <span>Phụ thu trẻ em</span>
              <strong>
                {fmt(priceBreakdown.phuThuTreEm)}
                {' '}
                đ
              </strong>
            </div>

            <div className="booking-confirm-price-row">
              <span>
                Thuế và phí (VAT
                {' '}
                {priceBreakdown.phanTramVat}
                %)
              </span>
              <strong>
                {fmt(priceBreakdown.thueVat)}
                {' '}
                đ
              </strong>
            </div>

            <div className="booking-confirm-price-total">
              <div>
                <span className="booking-confirm-price-total-label">Tổng thanh toán</span>
                <span className="booking-confirm-price-total-sub">
                  /
                  {roomCount}
                  {' '}
                  phòng,
                  {' '}
                  {nights}
                  {' '}
                  đêm
                </span>
              </div>
              <strong className="booking-confirm-price-total-value">
                {fmt(priceBreakdown.total)}
                {' '}
                đ
              </strong>
            </div>

            <button
              type="submit"
              form="booking-confirm-form"
              className="booking-confirm-submit"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Tiếp tục đặt phòng'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CustomerBookingPage;
