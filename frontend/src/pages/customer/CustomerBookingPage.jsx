import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import publicHotelService from '../../services/publicHotelService';
import customerBookingService from '../../services/customerBookingService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const CustomerBookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useSelector((state) => state.auth);

  const maKhachSan = searchParams.get('ma_khach_san') || '';
  const maLoaiPhong = searchParams.get('ma_loai_phong') || '';
  const ngayNhan = searchParams.get('ngay_nhan') || '';
  const ngayTra = searchParams.get('ngay_tra') || '';
  const soKhach = searchParams.get('so_khach') || '2';

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    ten_nguoi_nhan: '',
    sdt_nguoi_nhan: '',
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
    if (!ngayNhan || !ngayTra) return 1;
    const a = new Date(ngayNhan);
    const b = new Date(ngayTra);
    return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
  }, [ngayNhan, ngayTra]);

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
    if (!maKhachSan || !maLoaiPhong || !ngayNhan || !ngayTra) {
      setLoading(false);
      setError('Thiếu thông tin đặt phòng. Vui lòng chọn lại phòng từ trang tìm kiếm.');
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
      <div className="booking-page">
        <div className="content-card"style={{ textAlign: 'center', padding: 64, color: '#5a7a72'}}>
           Đang tải thông tin đặt phòng...
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="booking-page">
        <div className="content-card"style={{ textAlign:'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}> {error}</p>
          <Link to={ROUTES.CUSTOMER.HOTELS} className="btn btn-outline">← Quay lại tìm kiếm</Link>
        </div>
      </div>
    );
  }

  const hotel = room?.khach_san;
  const roomImg = room?.hinh_anh?.find((i) => i.la_anh_chinh) || room?.hinh_anh?.[0];

  return (
    <div className="booking-page">
      <Link to={backUrl} className="btn btn-ghost btn-sm"style={{ marginBottom: 16 }}>
        ← Quay lại chi tiết phòng
      </Link>

      <h1 className="booking-page-title">Xác nhận đặt phòng</h1>

      <div className="booking-layout">
        <form className="booking-form content-card"onSubmit={handleSubmit}>
          <h3 className="content-card-title">Thông tin người nhận phòng</h3>

          <div className="booking-field">
            <label className="booking-label"htmlFor="ten_nguoi_nhan">Họ và tên *</label>
            <input
              id="ten_nguoi_nhan"className="booking-input"value={form.ten_nguoi_nhan}
              onChange={(e) => setForm((p) => ({ ...p, ten_nguoi_nhan: e.target.value }))}
              required
              maxLength={100}
            />
          </div>

          <div className="booking-field">
            <label className="booking-label"htmlFor="sdt_nguoi_nhan">Số điện thoại *</label>
            <input
              id="sdt_nguoi_nhan"className="booking-input"value={form.sdt_nguoi_nhan}
              onChange={(e) => setForm((p) => ({ ...p, sdt_nguoi_nhan: e.target.value }))}
              required
              maxLength={15}
            />
          </div>

          <div className="booking-field">
            <span className="booking-label">Phương thức thanh toán *</span>
            <div className="booking-radio-group">
              <label className="booking-radio">
                <input
                  type="radio"name="phuong_thuc_tt"value="truc_tuyen"checked={form.phuong_thuc_tt === 'truc_tuyen'}
                  onChange={(e) => setForm((p) => ({ ...p, phuong_thuc_tt: e.target.value }))}
                />
                Thanh toán trực tuyến
              </label>
              <label className="booking-radio">
                <input
                  type="radio"name="phuong_thuc_tt"value="tai_khach_san"checked={form.phuong_thuc_tt === 'tai_khach_san'}
                  onChange={(e) => setForm((p) => ({ ...p, phuong_thuc_tt: e.target.value }))}
                />
                Thanh toán tại khách sạn
              </label>
            </div>
          </div>

          <div className="booking-field">
            <label className="booking-label"htmlFor="ghi_chu">Ghi chú (tuỳ chọn)</label>
            <textarea
              id="ghi_chu"className="booking-textarea"rows={3}
              value={form.ghi_chu}
              onChange={(e) => setForm((p) => ({ ...p, ghi_chu: e.target.value }))}
              placeholder="Yêu cầu đặc biệt, giờ đến sớm..."/>
          </div>

          {error && room && (
            <p className="booking-error"> {error}</p>
          )}
          {success && (
            <p className="booking-success"> {success}</p>
          )}

          <button type="submit"className="btn btn-primary"disabled={submitting || !!success} style={{ width: '100%', marginTop: 8 }}>
            {submitting ? 'Đang xử lý...':'Xác nhận đặt phòng'}
          </button>
        </form>

        <aside className="booking-summary content-card">
          <h3 className="content-card-title">Tóm tắt đặt phòng</h3>

          {roomImg && (
            <img src={resolveUploadUrl(roomImg.url)} alt={room?.ten_loai} className="booking-summary-img"/>
          )}

          <p className="booking-summary-hotel">{hotel?.ten}</p>
          <p className="booking-summary-room">{room?.ten_loai}</p>
          <p className="booking-summary-location"> {hotel?.dia_diem?.ten_dia_diem}</p>

          <div className="booking-summary-dates">
            <div>
              <span className="booking-summary-label">Nhận phòng</span>
              <strong>{fmtDate(ngayNhan)}</strong>
            </div>
            <span>→</span>
            <div>
              <span className="booking-summary-label">Trả phòng</span>
              <strong>{fmtDate(ngayTra)}</strong>
            </div>
          </div>

          <p className="booking-summary-meta">{nights} đêm · {soKhach} khách</p>

          <div className="booking-summary-total">
            <span>Tổng thanh toán</span>
            <strong>{fmt(room?.tong_gia)} ₫</strong>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CustomerBookingPage;
