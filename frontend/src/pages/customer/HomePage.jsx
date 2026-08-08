import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import ROUTES from '../../constants/routes';
import { resolveUploadUrl } from '../../utils/media';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  searchFormToParams,
  loadSearchForm,
  saveSearchForm,
} from '../../utils/hotelSearchStorage';
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

const normalizeName = (value) => (value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase();

const DEST_IMAGE_MAP = [
  { match: ['vung tau', 'ba ria'], url: '/uploads/ba-ria-vung-tau.jpg' },
  { match: ['da lat'], url: '/uploads/da-lat.jpeg' },
  { match: ['quy nhon'], url: '/uploads/quynhon.jpg' },
];

const resolveDestImage = (name, fallbackIndex) => {
  const key = normalizeName(name);
  const found = DEST_IMAGE_MAP.find((item) => item.match.some((m) => key.includes(m)));
  if (found) return resolveUploadUrl(found.url);
  return DEST_IMAGES[fallbackIndex % DEST_IMAGES.length];
};

const getMainHotelImage = (hotel) => {
  const images = hotel?.hinh_anh || [];
  const main = images.find((img) => img.la_anh_chinh) || images[0];
  return main ? resolveUploadUrl(main.url) : null;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [popular, setPopular] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [activeDest, setActiveDest] = useState(0);

  useEffect(() => {
    publicHotelService.getLocations()
      .then((res) => setLocations(res.data?.data || []))
      .catch(() => setLocations([]));

    publicHotelService.getPopularDestinations()
      .then((res) => setPopular(res.data?.data || []))
      .catch(() => setPopular([]));

    publicHotelService.getFeaturedByDestination()
      .then((res) => setFeatured(res.data?.data || []))
      .catch(() => setFeatured([]));

    const saved = loadSearchForm();
    if (saved?.ma_dia_diem) {
      saveSearchForm({ ...saved, ma_dia_diem: '' });
    }
  }, []);

  const handleSearch = (data) => {
    const params = searchFormToParams(data);
    navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${params.toString()}`);
  };

  const handleDestClick = (maDiaDiem) => {
    const params = new URLSearchParams();
    if (maDiaDiem) params.set('ma_dia_diem', String(maDiaDiem));
    navigate(`${ROUTES.CUSTOMER.HOTELS}?${params.toString()}`);
  };

  const handleHotelClick = (maKhachSan) => {
    navigate(ROUTES.CUSTOMER.HOTEL_DETAIL.replace(':id', maKhachSan));
  };

  const activeGroup = featured[activeDest] || null;

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
        initialValues={{ ma_dia_diem: '' }}
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
                <img src={resolveDestImage(dest.ten_dia_diem, i)} alt={dest.ten_dia_diem} />
                <div className="home-dest-overlay">
                  <p className="home-dest-name">{dest.ten_dia_diem}</p>
                  <p className="home-dest-count">{dest.so_khach_san} khách sạn</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Chỗ nghỉ nổi bật được đề xuất cho quý khách</h2>
            <p className="home-section-subtitle">Những khách sạn được đặt nhiều nhất tại mỗi điểm đến</p>
          </div>

          <div className="home-featured-tabbar">
            <div className="home-featured-tabs" role="tablist">
              {featured.map((group, i) => (
                <button
                  key={group.ma_dia_diem}
                  type="button"
                  role="tab"
                  aria-selected={activeDest === i}
                  className={`home-featured-tab${activeDest === i ? ' home-featured-tab--active' : ''}`}
                  onClick={() => setActiveDest(i)}
                >
                  {group.ten_dia_diem}
                </button>
              ))}
            </div>
            {activeGroup && (
              <button
                type="button"
                className="home-featured-more"
                onClick={() => handleDestClick(activeGroup.ma_dia_diem)}
              >
                Xem thêm các chỗ nghỉ ({activeGroup.ten_dia_diem}) ›
              </button>
            )}
          </div>

          {activeGroup && (
            <div className="home-featured-grid">
              {activeGroup.hotels.map((hotel) => {
                const img = getMainHotelImage(hotel);
                return (
                  <button
                    key={hotel.ma_khach_san}
                    type="button"
                    className="home-featured-card"
                    onClick={() => handleHotelClick(hotel.ma_khach_san)}
                  >
                    <div className="home-featured-media">
                      {img ? (
                        <img src={img} alt={hotel.ten} />
                      ) : (
                        <div className="home-featured-media-placeholder" />
                      )}
                      {hotel.diem_trung_binh > 0 && (
                        <span className="home-featured-score">{hotel.diem_trung_binh.toFixed(1)}</span>
                      )}
                    </div>
                    <div className="home-featured-body">
                      <h3 className="home-featured-name">{hotel.ten}</h3>
                      <div className="home-featured-meta">
                        <span className="home-featured-stars">{'★'.repeat(Number(hotel.so_sao) || 0)}</span>
                        <span className="home-featured-location">{hotel.dia_diem?.ten_dia_diem}</span>
                      </div>
                      {hotel.gia_tu != null && (
                        <p className="home-featured-price">
                          Giá mỗi đêm từ{' '}
                          <strong>{formatCurrency(hotel.gia_tu)}</strong>
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
    </div>
  );
};

export default HomePage;
