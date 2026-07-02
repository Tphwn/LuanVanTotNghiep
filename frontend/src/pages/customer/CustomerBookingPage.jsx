import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { useSelector } from 'react-redux';
import publicHotelService from '../../services/publicHotelService';
import customerBookingService from '../../services/customerBookingService';
import RoomSpecs from '../../components/customer/RoomSpecs';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { resolveBookingQuery } from '../../utils/bookingNavigation';
import { formatHotelTime } from '../../utils/bookingDisplay';
import {
  buildAccommodationPolicyGroups,
  buildCancellationPolicyItems,
} from '../../utils/hotelPolicyUtils';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);

const fmtShortDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
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

const PolicyBox = ({ title, children, emptyText }) => (
  <div className="booking-confirm-policy-block">
    <h3 className="booking-confirm-section-title">{title}</h3>
    <div className="booking-confirm-policy-box">
      {children || (
        <p className="booking-confirm-policy-empty">{emptyText}</p>
      )}
    </div>
  </div>
);

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
    ma_dia_diem: searchParams.get('ma_dia_diem') || '',
  }), [searchParams]);

  const maKhachSan = bookingParams.ma_khach_san;
  const maLoaiPhong = bookingParams.ma_loai_phong;
  const ngayNhan = bookingParams.ngay_nhan;
  const ngayTra = bookingParams.ngay_tra;
  const soKhach = bookingParams.so_khach;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  }), [ngayNhan, ngayTra, soKhach]);

  const backUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchParams.get('ma_dia_diem')) params.set('ma_dia_diem', searchParams.get('ma_dia_diem'));
    if (ngayNhan) params.set('ngay_nhan', ngayNhan);
    if (ngayTra) params.set('ngay_tra', ngayTra);
    if (soKhach) params.set('so_khach', soKhach);
    const qs = params.toString();
    return `/hotels/${maKhachSan}/rooms/${maLoaiPhong}${qs ? `?${qs}` : ''}`;
  }, [maKhachSan, maLoaiPhong, ngayNhan, ngayTra, soKhach, searchParams]);

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

  const priceBreakdown = useMemo(() => {
    const total = Number(room?.tong_gia) || 0;
    const taxFees = Math.round(total - total / 1.1);
    const roomSubtotal = total - taxFees;
    const avgNight = room?.gia_hien_thi || (nights ? Math.round(roomSubtotal / nights) : roomSubtotal);
    return { total, taxFees, roomSubtotal, avgNight };
  }, [room, nights]);

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
    if (user) {
      setForm((prev) => ({
        ...prev,
        ten_nguoi_nhan: prev.ten_nguoi_nhan || user.ho_ten || '',
        sdt_nguoi_nhan: prev.sdt_nguoi_nhan || user.so_dien_thoai || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await customerBookingService.createBooking({
        ma_loai_phong: Number(maLoaiPhong),
        ngay_nhan: ngayNhan,
        ngay_tra: ngayTra,
        so_khach: Math.max(Number(soKhach) || 0, 1),
        ten_nguoi_nhan: form.ten_nguoi_nhan.trim(),
        sdt_nguoi_nhan: form.sdt_nguoi_nhan.trim(),
        phuong_thuc_tt: form.phuong_thuc_tt,
        ghi_chu: form.ghi_chu.trim() || undefined,
      });

      const data = res.data?.data;
      setSuccess(`Đặt phòng thành công! Mã đơn: ${data?.ma_don_hang}`);
      setTimeout(() => navigate(ROUTES.CUSTOMER.MY_BOOKINGS), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt phòng');
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
        <h1 className="booking-confirm-title">Xác nhận đặt phòng</h1>
      </div>

      <div className="booking-confirm-layout">
        <form id="booking-confirm-form" className="booking-confirm-main" onSubmit={handleSubmit}>
          <div className="booking-confirm-card">
            <h2 className="booking-confirm-section-title">Thông tin khách hàng</h2>

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
                  className="booking-confirm-input"
                  value={form.sdt_nguoi_nhan}
                  onChange={(e) => setForm((p) => ({ ...p, sdt_nguoi_nhan: e.target.value }))}
                  required
                  maxLength={15}
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
                  maxLength={120}
                />
              </div>
            </div>

            

          </div>

          <PolicyBox
            title="Chính sách chỗ ở"
            emptyText="Khách sạn chưa cập nhật chính sách chỗ ở."
          >
            <AccommodationPolicyDisplay groups={accommodationPolicies} />
          </PolicyBox>

          <PolicyBox
            title="Chính sách hủy"
            emptyText="Khách sạn chưa cấu hình chính sách hủy — hủy đặt phòng có thể mất 100% tiền cọc."
          >
            {hasCancelRules && (
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
            )}
          </PolicyBox>

          {error && room && (
            <p className="booking-confirm-error">{error}</p>
          )}
          {success && (
            <p className="booking-confirm-success">{success}</p>
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

            <RoomSpecs
              sucChua={room?.suc_chua}
              dienTich={room?.dien_tich}
              soGiuong={room?.so_giuong}
            />
          </div>

          <div className="booking-confirm-card booking-confirm-price">
            <h2 className="booking-confirm-section-title">Chi tiết giá</h2>

            <div className="booking-confirm-price-row">
              <span>Giá phòng</span>
              <strong>{fmt(priceBreakdown.avgNight)} VNĐ</strong>
            </div>
            <div className="booking-confirm-price-sub">
              <span>1 phòng {room?.ten_loai}</span>
              <span>{nights} đêm</span>
            </div>

            <div className="booking-confirm-price-row">
              <span>Thuế và phí</span>
              <strong>{fmt(priceBreakdown.taxFees)} VNĐ</strong>
            </div>

            <div className="booking-confirm-price-total">
              <div>
                <span className="booking-confirm-price-total-label">Tổng cộng</span>
                <span className="booking-confirm-price-total-sub">/ 1 phòng, {nights} đêm</span>
              </div>
              <strong className="booking-confirm-price-total-value">
                {fmt(priceBreakdown.total)} VNĐ
              </strong>
            </div>

            <button
              type="submit"
              form="booking-confirm-form"
              className="booking-confirm-submit"
              disabled={submitting || !!success}
            >
              {submitting ? 'Đang xử lý...' : 'Đặt Phòng'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CustomerBookingPage;
