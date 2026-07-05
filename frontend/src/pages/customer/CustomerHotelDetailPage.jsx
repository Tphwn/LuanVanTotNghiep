import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Images } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CustomerButton from '../../components/customer/CustomerButton';
import CustomerAmenityTags from '../../components/customer/CustomerAmenityTags';
import CustomerPriceOffer from '../../components/customer/CustomerPriceOffer';
import RoomOfferCard from '../../components/customer/RoomOfferCard';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import { formatHotelTime } from '../../utils/bookingDisplay';
import { buildCustomerBookingUrl } from '../../utils/bookingNavigation';
import { resolveSearchForm } from '../../utils/hotelSearchStorage';
import '../../assets/styles/home.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const stars = (n) => '★'.repeat(Math.max(0, Number(n) || 0));

const buildQueryString = (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
};

const buildBookingUrl = (hotelId, roomId, query) => buildCustomerBookingUrl(hotelId, roomId, query);

const ExpandableIntro = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (expanded) return undefined;
    const el = textRef.current;
    if (!el) return undefined;

    const checkOverflow = () => {
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    const frameId = requestAnimationFrame(checkOverflow);
    return () => cancelAnimationFrame(frameId);
  }, [text, expanded]);

  return (
    <div className="hotel-detail-intro-wrap">
      <p
        ref={textRef}
        className={`hotel-detail-intro${expanded ? '' : ' hotel-detail-intro--clamped'}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className="hotel-detail-intro-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

const CustomerHotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const roomListRef = useRef(null);

  const query = useMemo(() => {
    const resolved = resolveSearchForm({
      ma_dia_diem: searchParams.get('ma_dia_diem') || '',
      ngay_nhan: searchParams.get('ngay_nhan') || '',
      ngay_tra: searchParams.get('ngay_tra') || '',
      so_khach: searchParams.get('so_khach') || '',
      tre_em: searchParams.get('tre_em') || '',
      so_phong: searchParams.get('so_phong') || '',
    });
    return {
      ma_dia_diem: resolved.ma_dia_diem,
      ngay_nhan: resolved.ngay_nhan,
      ngay_tra: resolved.ngay_tra,
      so_khach: String(resolved.so_khach),
      tre_em: String(resolved.tre_em || 0),
      so_phong: String(resolved.so_phong || 1),
    };
  }, [searchParams]);

  const isSearchMode = Boolean(query.ngay_nhan && query.ngay_tra);

  const backUrl = useMemo(() => {
    const qs = buildQueryString(query);
    const base = isSearchMode ? ROUTES.CUSTOMER.ROOM_SEARCH : ROUTES.CUSTOMER.HOTELS;
    return `${base}${qs ? `?${qs}` : ''}`;
  }, [query, isSearchMode]);

  const nights = useMemo(() => {
    if (!query.ngay_nhan || !query.ngay_tra) return 1;
    const a = new Date(query.ngay_nhan);
    const b = new Date(query.ngay_tra);
    return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
  }, [query.ngay_nhan, query.ngay_tra]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicHotelService.getHotelById(id, query);
        setHotel(res.data?.data || null);
        setActiveImg(0);
      } catch (err) {
        setHotel(null);
        setError(err.response?.data?.message || 'Không thể tải thông tin khách sạn');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, query]);

  const scrollToRooms = () => {
    roomListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBookRoom = (roomId) => {
    const room = hotel?.loai_phong?.find((r) => r.ma_loai_phong === roomId);
    if (!room || (room.phong_con_lai ?? 0) < Number(query.so_phong || 1)) return;

    const bookingUrl = buildBookingUrl(id, roomId, query);
    if (!token) {
      navigate(ROUTES.LOGIN, { state: { from: bookingUrl } });
      return;
    }
    navigate(bookingUrl);
  };

  if (loading) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 64, color: '#5a7a72' }}>
          Đang tải chi tiết khách sạn...
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}>{error || 'Không tìm thấy khách sạn'}</p>
          <BackButton to={backUrl} variant="outline" />
        </div>
      </div>
    );
  }

  const images = hotel.hinh_anh || [];
  const mainImg = images[activeImg] || images[0];
  const sideImages = images.slice(1, 5);
  const reviews = hotel.danh_gia || [];
  const addressLine = [
    hotel.dia_diem?.ten_dia_diem,
    hotel.dia_chi,
  ].filter(Boolean).join(' - ');

  return (
    <div className="hotel-detail-page">
      <BackButton to={backUrl} className="page-back-btn--standalone" />

      {images.length > 0 ? (
        <div className="hotel-gallery-mosaic hotel-gallery-mosaic--tall">
          <div className="hotel-gallery-main">
            {mainImg && (
              <img src={resolveUploadUrl(mainImg.url)} alt={hotel.ten} />
            )}
          </div>
          {sideImages.length > 0 && (
            <div className="hotel-gallery-side hotel-gallery-side--3rows">
              {sideImages.map((img, i) => {
                const realIndex = i + 1;
                const isLast = i === sideImages.length - 1 && images.length > 5;
                return (
                  <button
                    key={img.ma_hinh_anh || realIndex}
                    type="button"
                    className={`hotel-gallery-thumb${isLast ? ' hotel-gallery-thumb--more' : ''}`}
                    onClick={() => (isLast ? setLightboxOpen(true) : setActiveImg(realIndex))}
                  >
                    <img src={resolveUploadUrl(img.url)} alt="" />
                    {isLast && (
                      <span className="hotel-gallery-more-label">
                        <Images size={20} strokeWidth={1.5} style={{ marginBottom: 4 }} />
                        Xem tất cả {images.length} hình
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="hotel-detail-main-img hotel-detail-img-placeholder" style={{ marginBottom: 16 }} />
      )}

      <div className="hotel-detail-body">
        <div className="hotel-detail-main-col">
          <h1 className="hotel-detail-name">{hotel.ten}</h1>
          <div className="hotel-detail-meta-row">
            <span className="hotel-detail-type-badge">Khách sạn</span>
            {hotel.so_sao > 0 && (
              <span className="hotel-result-stars">{stars(hotel.so_sao)}</span>
            )}
          </div>
          {addressLine && (
            <p className="hotel-detail-location">{addressLine}</p>
          )}

          {hotel.tien_nghi?.length > 0 && (
            <section className="hotel-detail-block">
              <h2 className="hotel-detail-block-title">Tiện nghi</h2>
              <CustomerAmenityTags
                items={hotel.tien_nghi}
                className="hotel-detail-amenity-grid customer-amenity-tags"
              />
            </section>
          )}

          {hotel.mo_ta && (
            <section className="hotel-detail-block">
              <h2 className="hotel-detail-block-title">Giới thiệu</h2>
              <ExpandableIntro key={hotel.mo_ta} text={hotel.mo_ta} />
            </section>
          )}
        </div>

        <aside className="hotel-detail-booking-card">
          {hotel.gia_tu && (
            <CustomerPriceOffer
              amount={hotel.gia_tu}
              originalAmount={hotel.gia_goc}
              align="left"
              showTaxNote={false}
              className="hotel-detail-booking-price-row"
            />
          )}
          {query.ngay_nhan && query.ngay_tra ? (
            <p className="hotel-detail-booking-sub">
              {fmtDate(query.ngay_nhan)} – {fmtDate(query.ngay_tra)} · {nights} đêm
            </p>
          ) : (
            <p className="hotel-detail-booking-sub">(Chưa bao gồm thuế và phí)</p>
          )}
          <div className="hotel-detail-check-times">
            <div>
              <span className="hotel-detail-check-label">Nhận phòng:</span>
              <strong>{formatHotelTime(hotel.gio_nhan_phong, '14:00')}</strong>
            </div>
            <div>
              <span className="hotel-detail-check-label">Trả phòng:</span>
              <strong>{formatHotelTime(hotel.gio_tra_phong, '12:00')}</strong>
            </div>
          </div>
          <CustomerButton className="hotel-detail-booking-btn" fullWidth onClick={scrollToRooms}>
            Chọn phòng
          </CustomerButton>
        </aside>
      </div>

      <section className="hotel-detail-rooms-section" ref={roomListRef}>
        <h2 className="hotel-detail-rooms-heading">
          Các Loại phòng có tại: {hotel.ten}
        </h2>

        {!hotel.loai_phong?.length ? (
          <div className="empty-state">
            <p className="empty-state-text">
              Không có loại phòng phù hợp cho {Number(query.so_phong || 1)} phòng, {Number(query.so_khach) + Number(query.tre_em || 0)} người
              {isSearchMode ? ' trong khoảng thời gian đã chọn' : ''}
            </p>
          </div>
        ) : (
          <div className="hotel-detail-room-list">
            {hotel.loai_phong.map((room) => (
              <RoomOfferCard
                key={room.ma_loai_phong}
                room={room}
                soPhong={Number(query.so_phong) || 1}
                onBook={handleBookRoom}
              />
            ))}
          </div>
        )}
      </section>

      <section className="hotel-detail-reviews-section">
        <h2 className="hotel-detail-block-title hotel-detail-reviews-title">
          Đánh giá của khách hàng{hotel.so_danh_gia > 0 ? ` (${hotel.so_danh_gia})` : ''}
        </h2>
        {reviews.length === 0 ? (
          <p className="hotel-detail-reviews-empty">Chưa có đánh giá cho khách sạn này</p>
        ) : (
          <div className="hotel-review-list">
            {reviews.map((rv) => (
              <article key={rv.ma_danh_gia} className="hotel-review-item">
                <div className="hotel-review-grid">
                  <div className="hotel-review-left">
                    <div className="hotel-review-author">{rv.khach_hang?.ho_ten || 'Khách hàng'}</div>
                    {rv.ten_loai_phong && (
                      <div className="hotel-review-room-block">
                        <span className="hotel-review-room-label">Sử dụng loại phòng:</span>
                        <span className="hotel-review-room-name">{rv.ten_loai_phong}</span>
                      </div>
                    )}
                  </div>
                  <div className="hotel-review-right">
                    <div className="hotel-review-meta">
                      <span className="hotel-review-score">{rv.so_sao}/5</span>
                      <span className="hotel-review-date">{fmtDate(rv.ngay_danh_gia)}</span>
                    </div>
                    {rv.noi_dung && (
                      <p className="hotel-review-content">{rv.noi_dung}</p>
                    )}
                    {rv.phan_hoi_doi_tac && (
                      <div className="hotel-review-partner-reply">
                        {rv.phan_hoi_doi_tac}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {lightboxOpen && images.length > 0 && (
        <div className="hotel-gallery-lightbox" role="dialog" aria-modal="true">
          <button type="button" className="hotel-gallery-lightbox-close" onClick={() => setLightboxOpen(false)}>
            ×
          </button>
          <div className="hotel-gallery-lightbox-grid">
            {images.map((img, i) => (
              <button
                key={img.ma_hinh_anh || i}
                type="button"
                className={`hotel-gallery-lightbox-item${i === activeImg ? ' active' : ''}`}
                onClick={() => { setActiveImg(i); setLightboxOpen(false); }}
              >
                <img src={resolveUploadUrl(img.url)} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHotelDetailPage;
