import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import BackButton from '../../components/common/BackButton';
import RoomSpecs from '../../components/customer/RoomSpecs';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import { ROOM_CATEGORY_GROUPS } from '../admin/amenities/constants';
import { groupAmenitiesByCategory } from '../admin/amenities/utils';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const buildQueryString = (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
};

const buildBookingUrl = (hId, roomId, query) => {
  const params = new URLSearchParams();
  params.set('ma_khach_san', String(hId));
  params.set('ma_loai_phong', String(roomId));
  if (query.ngay_nhan) params.set('ngay_nhan', query.ngay_nhan);
  if (query.ngay_tra) params.set('ngay_tra', query.ngay_tra);
  if (query.so_khach) params.set('so_khach', query.so_khach);
  if (query.ma_dia_diem) params.set('ma_dia_diem', query.ma_dia_diem);
  return `${ROUTES.CUSTOMER.BOOKING}?${params.toString()}`;
};

const CustomerRoomDetailPage = () => {
  const navigate = useNavigate();
  const { hotelId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useSelector((state) => state.auth);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  const query = useMemo(() => ({
    ma_dia_diem: searchParams.get('ma_dia_diem') || '',
    ngay_nhan: searchParams.get('ngay_nhan') || '',
    ngay_tra: searchParams.get('ngay_tra') || '',
    so_khach: searchParams.get('so_khach') || '2',
  }), [searchParams]);

  const backUrl = useMemo(() => {
    const qs = buildQueryString(query);
    return `/hotels/${hotelId}${qs ? `?${qs}` : ''}`;
  }, [hotelId, query]);

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
        const res = await publicHotelService.getRoomById(hotelId, roomId, query);
        setRoom(res.data?.data || null);
        setActiveImg(0);
      } catch (err) {
        setRoom(null);
        setError(err.response?.data?.message || 'Không thể tải chi tiết loại phòng');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hotelId, roomId, query]);

  const handleBook = () => {
    const bookingUrl = buildBookingUrl(hotelId, roomId, query);
    if (!token) {
      navigate(ROUTES.LOGIN, { state: { from: bookingUrl } });
      return;
    }
    navigate(bookingUrl);
  };

  if (loading) {
    return (
      <div className="room-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 64, color: '#5a7a72' }}>
          Đang tải chi tiết loại phòng...
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="room-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}>{error || 'Không tìm thấy loại phòng'}</p>
          <BackButton to={backUrl} variant="outline" />
        </div>
      </div>
    );
  }

  const hotel = room.khach_san;
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
  const reviews = room.danh_gia || [];
  const amenityGroups = room.tien_nghi?.length
    ? groupAmenitiesByCategory(room.tien_nghi, ROOM_CATEGORY_GROUPS).filter((g) => g.items.length > 0)
    : [];

  const prevImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i + 1) % images.length);
  };

  return (
    <div className="room-detail-page">
      <BackButton to={backUrl} label="Quay lại" className="page-back-btn--standalone" />

      <p className="room-detail-hotel-name">{hotel?.ten}</p>

      <div className="room-detail-layout">
        <div className="room-detail-gallery">
          <div className="room-detail-main-view">
            {currentImg ? (
              <img src={resolveUploadUrl(currentImg.url)} alt={room.ten_loai} />
            ) : (
              <div className="room-detail-main-placeholder" />
            )}
            {images.length > 1 && (
              <>
                <button type="button" className="room-detail-nav room-detail-nav--prev" onClick={prevImg} aria-label="Ảnh trước">
                  <ChevronLeft size={22} />
                </button>
                <button type="button" className="room-detail-nav room-detail-nav--next" onClick={nextImg} aria-label="Ảnh sau">
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {images.length > 0 && (
            <div className="room-detail-thumb-bar">
              <span className="room-detail-thumb-label">Khác</span>
              <div className="room-detail-thumb-list">
                {images.map((img, i) => (
                  <button
                    key={img.ma_hinh_anh || i}
                    type="button"
                    className={`room-detail-thumb${i === activeImg ? ' active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={resolveUploadUrl(img.url)} alt="" />
                  </button>
                ))}
              </div>
              <span className="room-detail-thumb-count">
                {activeImg + 1}/{images.length}
              </span>
            </div>
          )}
        </div>

        <aside className="room-detail-panel">
          <h1 className="room-detail-title">{room.ten_loai}</h1>

          <section className="room-detail-block">
            <h2 className="room-detail-block-title">Thông tin phòng</h2>
            <RoomSpecs
              sucChua={room.suc_chua}
              dienTich={room.dien_tich}
              soGiuong={room.so_giuong}
            />
            {room.phong_con_lai != null && room.so_luong_phong != null && (
              <p className="room-detail-stock">
                Còn {room.phong_con_lai}/{room.so_luong_phong} phòng
              </p>
            )}
            {query.ngay_nhan && query.ngay_tra && (
              <p className="room-detail-dates">
                {fmtDate(query.ngay_nhan)} – {fmtDate(query.ngay_tra)}
                {nights > 1 ? ` · ${nights} đêm` : ''}
              </p>
            )}
          </section>

          {amenityGroups.length > 0 && (
            <section className="room-detail-block">
              <h2 className="room-detail-block-title">Tiện ích có tại phòng:</h2>
              {amenityGroups.map((group) => (
                <div key={group.id} className="room-detail-amenity-group">
                  <h3 className="room-detail-amenity-group-title">{group.label}</h3>
                  <div className="room-detail-amenity-tags">
                    {group.items.map((item) => (
                      <span key={item.ma_tien_nghi || item.ten} className="room-detail-amenity-tag">
                        {item.ten}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="room-detail-booking">
            <div className="room-detail-price-row">
              <span className="room-detail-price-label">Giá:</span>
              <span className="room-detail-price-value">{fmt(room.gia_hien_thi)} VNĐ</span>
            </div>
            {nights > 1 && room.tong_gia && (
              <p className="room-detail-total">Tổng {nights} đêm: {fmt(room.tong_gia)} VNĐ</p>
            )}
            <button type="button" className="btn btn-primary room-detail-book-btn" onClick={handleBook}>
              Đặt phòng ngay
            </button>
          </div>
        </aside>
      </div>

      {room.mo_ta && (
        <section className="room-detail-section-below">
          <h2 className="room-detail-block-title">Mô tả phòng</h2>
          <p className="room-detail-desc">{room.mo_ta}</p>
        </section>
      )}

      <section className="room-detail-section-below">
        <h2 className="room-detail-block-title">
          Đánh giá {room.so_danh_gia > 0 ? `(${room.so_danh_gia})` : ''}
        </h2>
        {reviews.length === 0 ? (
          <p className="room-detail-empty">Chưa có đánh giá cho loại phòng này</p>
        ) : (
          <div className="hotel-review-list">
            {reviews.map((rv) => (
              <article key={rv.ma_danh_gia} className="hotel-review-item">
                <div className="hotel-review-head">
                  <span className="hotel-review-author">{rv.khach_hang?.ho_ten || 'Khách hàng'}</span>
                  <span className="hotel-review-score">{rv.so_sao}/5</span>
                </div>
                {rv.noi_dung && <p className="hotel-review-content">{rv.noi_dung}</p>}
                <div className="hotel-review-date">{fmtDate(rv.ngay_danh_gia)}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerRoomDetailPage;
