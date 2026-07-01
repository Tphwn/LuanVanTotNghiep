import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import RoomSpecs from '../../components/customer/RoomSpecs';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import { getAmenityLucideIcon } from '../../utils/amenityIcons';
import ROUTES from '../../constants/routes';
import { formatHotelTime } from '../../utils/bookingDisplay';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const stars = (n) => '★'.repeat(Math.max(0, Number(n) || 0));

const buildQueryString = (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
};

const buildBookingUrl = (hotelId, roomId, query) => {
  const params = new URLSearchParams();
  params.set('ma_khach_san', String(hotelId));
  params.set('ma_loai_phong', String(roomId));
  if (query.ngay_nhan) params.set('ngay_nhan', query.ngay_nhan);
  if (query.ngay_tra) params.set('ngay_tra', query.ngay_tra);
  if (query.so_khach) params.set('so_khach', query.so_khach);
  if (query.ma_dia_diem) params.set('ma_dia_diem', query.ma_dia_diem);
  return `${ROUTES.CUSTOMER.BOOKING}?${params.toString()}`;
};

const AmenityIcon = ({ amenity }) => {
  const Icon = getAmenityLucideIcon(amenity.bieu_tuong || amenity.ten);
  return createElement(Icon, { size: 18, strokeWidth: 1.6, 'aria-hidden': true });
};

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

const RoomOfferCard = ({
  room,
  nights,
  buildRoomUrl,
  onBook,
}) => {
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const [imgIdx, setImgIdx] = useState(0);
  const currentImg = images[imgIdx] || images.find((i) => i.la_anh_chinh) || images[0];
  const amenityNames = (room.tien_nghi || []).map((t) => t.ten || t).slice(0, 6);

  const prevImg = () => setImgIdx((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  const nextImg = () => setImgIdx((i) => (images.length ? (i + 1) % images.length : 0));

  return (
    <article className="hotel-room-offer-card">
      <div className="hotel-room-offer-media-col">
        <div className="hotel-room-offer-media">
          {currentImg ? (
            <img src={resolveUploadUrl(currentImg.url)} alt={room.ten_loai} />
          ) : (
            <div className="hotel-room-offer-media-placeholder" />
          )}
          {images.length > 1 && (
            <>
              <button type="button" className="hotel-room-offer-nav hotel-room-offer-nav--prev" onClick={prevImg} aria-label="Ảnh trước">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="hotel-room-offer-nav hotel-room-offer-nav--next" onClick={nextImg} aria-label="Ảnh sau">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
        <Link to={buildRoomUrl(room.ma_loai_phong)} className="hotel-room-offer-detail-link">
          Chi tiết phòng
        </Link>
      </div>

      <div className="hotel-room-offer-body">
        <h3 className="hotel-room-offer-name">{room.ten_loai}</h3>
        <RoomSpecs
          sucChua={room.suc_chua}
          dienTich={room.dien_tich}
          soGiuong={room.so_giuong}
        />
        {amenityNames.length > 0 && (
          <ul className="hotel-room-offer-amenities">
            {amenityNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="hotel-room-offer-aside">
        <div className="hotel-room-offer-price">{fmt(room.gia_hien_thi)} VNĐ</div>
        <p className="hotel-room-offer-tax-note">(Chưa bao gồm thuế và phí)</p>
        {nights > 1 && room.tong_gia && (
          <p className="hotel-room-offer-total">Tổng {nights} đêm: {fmt(room.tong_gia)} VNĐ</p>
        )}
        {room.phong_con_lai != null && room.so_luong_phong != null && (
          <p className="hotel-room-offer-stock">Còn {room.phong_con_lai}/{room.so_luong_phong} phòng</p>
        )}
        <button type="button" className="btn btn-primary hotel-room-offer-cta" onClick={() => onBook(room.ma_loai_phong)}>
          Đặt Phòng Ngay
        </button>
      </div>
    </article>
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

  const query = useMemo(() => ({
    ma_dia_diem: searchParams.get('ma_dia_diem') || '',
    ngay_nhan: searchParams.get('ngay_nhan') || '',
    ngay_tra: searchParams.get('ngay_tra') || '',
    so_khach: searchParams.get('so_khach') || '2',
  }), [searchParams]);

  const isSearchMode = Boolean(query.ngay_nhan && query.ngay_tra);

  const buildRoomUrl = (roomId) => {
    const qs = buildQueryString(query);
    return `/hotels/${id}/rooms/${roomId}${qs ? `?${qs}` : ''}`;
  };

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
              <div className="hotel-detail-amenity-grid">
                {hotel.tien_nghi.map((tn) => (
                  <div key={tn.ma_tien_nghi || tn.ten} className="hotel-detail-amenity-item">
                    <span className="hotel-detail-amenity-icon">
                      <AmenityIcon amenity={tn} />
                    </span>
                    <span>{tn.ten}</span>
                  </div>
                ))}
              </div>
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
            <div className="hotel-detail-booking-price-row">
              <span className="hotel-detail-booking-price-label">Giá từ:</span>
              <span className="hotel-detail-booking-price-value">{fmt(hotel.gia_tu)} VNĐ</span>
            </div>
          )}
          {query.ngay_nhan && query.ngay_tra ? (
            <p className="hotel-detail-booking-sub">
              {fmtDate(query.ngay_nhan)} – {fmtDate(query.ngay_tra)} · {nights} đêm
            </p>
          ) : (
            <p className="hotel-detail-booking-sub">Tổng cộng (bao gồm thuế và phí)</p>
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
          <button type="button" className="btn btn-primary hotel-detail-booking-btn" onClick={scrollToRooms}>
            Chọn Phòng
          </button>
        </aside>
      </div>

      <section className="hotel-detail-rooms-section" ref={roomListRef}>
        <h2 className="hotel-detail-rooms-heading">
          Các Loại phòng có tại: {hotel.ten}
        </h2>

        {!hotel.loai_phong?.length ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có phòng trống cho khoảng thời gian đã chọn</p>
          </div>
        ) : (
          <div className="hotel-detail-room-list">
            {hotel.loai_phong.map((room) => (
              <RoomOfferCard
                key={room.ma_loai_phong}
                room={room}
                nights={nights}
                buildRoomUrl={buildRoomUrl}
                onBook={handleBookRoom}
              />
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
