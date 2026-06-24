import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import ROUTES from '../../constants/routes';
import { resolveUploadUrl } from '../../utils/media';
import '../../assets/styles/home.css';
import DateRangePicker from '../../components/customer/search/DateRangePicker';
import GuestBedPicker from '../../components/customer/search/GuestBedPicker';
const DEST_IMAGES = [
  'https://images.unsplash.com/photo-1559592413-7f4b5a8c2f3a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const todayStr = () => new Date().toISOString().split('T')[0];

const HomePage = () => {
  
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [popular, setPopular] = useState([]);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [form, setForm] = useState({
    ma_dia_diem: '',
    ngay_nhan: addDays(new Date(), 1),
    ngay_tra: addDays(new Date(), 2),
    so_khach: 2,
    so_giuong: 1,
    tre_em: 0,
    so_phong: 1,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    publicHotelService.getLocations()
      .then((res) => setLocations(res.data?.data || []))
      .catch(() => setLocations([]));

    publicHotelService.getPopularDestinations()
      .then((res) => setPopular(res.data?.data || []))
      .catch(() => setPopular([]));
  }, []);

  const locationLabel = useMemo(() => {
    if (!form.ma_dia_diem) return 'Tất cả địa điểm';
    return locations.find((l) => String(l.ma_dia_diem) === String(form.ma_dia_diem))?.ten_dia_diem || '';
  }, [form.ma_dia_diem, locations]);

  const validateWithData = (data) => {
    if (data.ngay_tra <= data.ngay_nhan) {
      setError('Ngày trả phòng phải sau ngày nhận phòng');
      return false;
    }
    if (data.ngay_nhan < todayStr()) {
      setError('Ngày nhận phòng không được ở quá khứ');
      return false;
    }
    setError('');
    return true;
  };

  const handleSearch = (override = {}) => {
    const data = { ...form, ...override };
    if (!validateWithData(data)) return;

    const params = new URLSearchParams();
    if (data.ma_dia_diem) params.set('ma_dia_diem', data.ma_dia_diem);
    params.set('ngay_nhan', data.ngay_nhan);
    params.set('ngay_tra', data.ngay_tra);
    params.set('so_khach', String(Math.max(1, Number(data.so_khach) || 1)));
    params.set('so_giuong', String(Math.max(1, Number(data.so_giuong) || 1)));
    navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${params.toString()}`); 
  };

  const handleDestClick = (maDiaDiem) => {
    handleSearch({ ma_dia_diem: String(maDiaDiem) });
  };

  return (
    <div className="home-page">
      <section
        className="home-hero"
        style={{ backgroundImage: `url(${resolveUploadUrl('/uploads/banner.png')})` }}
      >
        <div className="home-hero-content">
          <h1 className="home-hero-title">Khám phá khách sạn tuyệt vời với giá tốt mỗi ngày</h1>
          <p className="home-hero-subtitle">
            Tìm và đặt phòng khách sạn tại Việt Nam nhanh chóng, minh bạch, nhiều lựa chọn phù hợp với mọi nhu cầu.
          </p>
        </div>
      </section>

      <div className="home-search-section">
        <div className="home-search-wrap">
        <div className="home-search-card">
         

          <div className="home-search-form">
            <div className="home-search-field">
              <label className="home-search-label"htmlFor="home-location">Địa điểm</label>
              <select
                id="home-location"className="home-search-select"value={form.ma_dia_diem}
                onChange={(e) => setForm((p) => ({ ...p, ma_dia_diem: e.target.value }))}
              >
                <option value="">Tất cả địa điểm</option>
                {locations.map((loc) => (
                  <option key={loc.ma_dia_diem} value={loc.ma_dia_diem}>
                    {loc.ten_dia_diem}{loc.tinh_thanh ? `, ${loc.tinh_thanh}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="home-search-field">
            <span className="home-search-label">Ngày nhận & trả phòng</span>
            <DateRangePicker
              ngayNhan={form.ngay_nhan}
              ngayTra={form.ngay_tra}
              open={dateOpen}
              onOpenChange={setDateOpen}
              onChange={({ ngay_nhan, ngay_tra }) =>
                setForm((p) => ({ ...p, ngay_nhan, ngay_tra }))
              }
              onCloseOther={() => setGuestOpen(false)}
            />
          </div>
          <div className="home-search-field">
            <span className="home-search-label">Khách & giường</span>
            <GuestBedPicker
              soKhach={form.so_khach}
              treEm={form.tre_em}
              soGiuong={form.so_giuong}
              open={guestOpen}
              onOpenChange={setGuestOpen}
              onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
              onCloseOther={() => setDateOpen(false)}
            />
          </div>

            <div className="home-search-btn-wrap">
              <button type="button"className="home-search-btn"onClick={() => handleSearch()}>
                 Tìm kiếm
              </button>
            </div>
          </div>

          {error && <div className="home-search-error"> {error}</div>}
        </div>
        </div>
      </div>

      {popular.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Điểm đến phổ biến</h2>
            <p className="home-section-subtitle">Khám phá các thành phố được yêu thích nhất</p>
          </div>
          <div className="home-dest-grid">
            {popular.map((dest, i) => (
              <button
                key={dest.ma_dia_diem}
                type="button"className="home-dest-card"onClick={() => handleDestClick(dest.ma_dia_diem)}
              >
                <img src={DEST_IMAGES[i % DEST_IMAGES.length]} alt={dest.ten_dia_diem} />
                <div className="home-dest-overlay">
                  <p className="home-dest-name">{dest.ten_dia_diem}</p>
                  <p className="home-dest-count">{dest.so_khach_san} khách sạn</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Vì sao chọn Hotel Booking?</h2>
          <p className="home-section-subtitle">Trải nghiệm đặt phòng đơn giản và tin cậy</p>
        </div>
        <div className="home-features">
          <div className="home-feature-card">
            <div className="home-feature-icon"></div>
            <h3 className="home-feature-title">Giá tốt mỗi ngày</h3>
            <p className="home-feature-desc">So sánh giá phòng từ nhiều khách sạn, luôn có ưu đãi hấp dẫn.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"></div>
            <h3 className="home-feature-title">Xác nhận nhanh</h3>
            <p className="home-feature-desc">Đặt phòng dễ dàng, theo dõi trạng thái đặt chỗ mọi lúc mọi nơi.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"></div>
            <h3 className="home-feature-title">An tâm đặt phòng</h3>
            <p className="home-feature-desc">Khách sạn được kiểm duyệt, thông tin minh bạch và hỗ trợ tận tình.</p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
         {new Date().getFullYear()} Hotel Booking — Nền tảng đặt phòng khách sạn
      </footer>
    </div>
  );
};

export default HomePage;
