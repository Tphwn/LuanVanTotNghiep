import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import ROUTES from '../../constants/routes';
import { resolveUploadUrl } from '../../utils/media';
import { searchFormToParams, resolveSearchForm, saveSearchForm } from '../../utils/hotelSearchStorage';
import HotelSearchBar from '../../components/customer/search/HotelSearchBar';
import '../../assets/styles/home.css';

const DEST_IMAGES = [
  'https://images.unsplash.com/photo-1559592413-7f4b5a8c2f3a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
];

const HomePage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    publicHotelService.getLocations()
      .then((res) => setLocations(res.data?.data || []))
      .catch(() => setLocations([]));

    publicHotelService.getPopularDestinations()
      .then((res) => setPopular(res.data?.data || []))
      .catch(() => setPopular([]));
  }, []);

  const handleSearch = (data) => {
    const params = searchFormToParams(data);
    navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${params.toString()}`);
  };

  const handleDestClick = (maDiaDiem) => {
    const data = resolveSearchForm({ ma_dia_diem: String(maDiaDiem) });
    saveSearchForm(data);
    handleSearch(data);
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

      <HotelSearchBar
        variant="hero"
        locations={locations}
        onSearch={handleSearch}
      />

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
                type="button"
                className="home-dest-card"
                onClick={() => handleDestClick(dest.ma_dia_diem)}
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
            <div className="home-feature-icon" />
            <h3 className="home-feature-title">Giá tốt mỗi ngày</h3>
            <p className="home-feature-desc">So sánh giá phòng từ nhiều khách sạn, luôn có ưu đãi hấp dẫn.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" />
            <h3 className="home-feature-title">Xác nhận nhanh</h3>
            <p className="home-feature-desc">Đặt phòng dễ dàng, theo dõi trạng thái đặt chỗ mọi lúc mọi nơi.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" />
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
