import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import RoomSpecs from '../../components/customer/RoomSpecs';
import { useSelector } from 'react-redux';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
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

const ratingLabel = (score) => {
  if (!score) return '';
  if (score >= 4.5) return 'Xuất sắc';
  if (score >= 4) return 'Rất tốt';
  if (score >= 3.5) return 'Tốt';
  return 'Khá';
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
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 64, color: '#5a7a72' }}>
          Đang tải chi tiết loại phòng...
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}>{error || 'Không tìm thấy loại phòng'}</p>
          <BackButton to={backUrl} variant="outline" />
        </div>
      </div>
    );
  }

  const hotel = room.khach_san;
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const mainImg = images[activeImg] || images[0];
  const sideImages = images.slice(1, 5);
  const reviews = room.danh_gia || [];
  const amenityNames = (room.tien_nghi || []).map((t) => t.ten || t);

  return (
    <div className="hotel-detail-page">
      <BackButton to={backUrl} label="Quay lại khách sạn" className="page-back-btn--standalone" />

      {images.length > 0 ? (
        <div className="hotel-gallery-mosaic">
          <div className="hotel-gallery-main">
            {mainImg && (
              <img src={resolveUploadUrl(mainImg.url)} alt={room.ten_loai} />
            )}
          </div>
          {sideImages.length > 0 && (
            <div className="hotel-gallery-side">
              {sideImages.map((img, i) => {
                const realIndex = i + 1;
                const isLast = i === sideImages.length - 1 && images.length > 5;
                return (
                  <button
                    key={img.ma_hinh_anh || realIndex}
                    type="button"
                    className={`hotel-gallery-thumb${isLast ? ' hotel-gallery-thumb--more' : ''}`}
                    onClick={() => (isLast ? setActiveImg(0) : setActiveImg(realIndex))}
                  >
                    <img src={resolveUploadUrl(img.url)} alt="" />
                    {isLast && (
                      <span className="hotel-gallery-more-label">
                        Xem tất cả hình ảnh ({images.length})
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

      {images.length > 1 && (
        <div className="hotel-detail-thumbs" style={{ marginBottom: 16 }}>
          {images.map((img, i) => (
            <button
              key={img.ma_hinh_anh || i}
              type="button"
              className={`hotel-detail-thumb${i === activeImg ? ' active' : ''}`}
              onClick={() => setActiveImg(i)}
            >
              <img src={resolveUploadUrl(img.url)} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="hotel-detail-summary-bar">
        <div className="hotel-detail-summary-left">
          <p style={{ margin: '0 0 6px', fontSize: 13, color: '#888' }}>{hotel?.ten}</p>
          <h1 className="hotel-detail-name">{room.ten_loai}</h1>
          <div style={{ marginTop: 8 }}>
            <span className="hotel-detail-type-badge">Loại phòng</span>
          </div>
          <RoomSpecs
            sucChua={room.suc_chua}
            dienTich={room.dien_tich}
            soGiuong={room.so_giuong}
          />
        </div>

        <div className="hotel-detail-summary-right">
          {room.so_danh_gia > 0 && (
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#3C7363', fontWeight: 600 }}>
              {room.diem_trung_binh}/5 · {ratingLabel(room.diem_trung_binh)}
            </p>
          )}
          <div className="hotel-detail-price-big">{fmt(room.gia_hien_thi)} ₫</div>
          <p className="hotel-detail-price-from">/ phòng / đêm</p>
          {room.phong_con_lai != null && room.so_luong_phong != null && (
            <span className="hotel-room-stock" style={{ textAlign: 'right', display: 'block', marginBottom: 8 }}>
              {room.phong_con_lai}/{room.so_luong_phong}
            </span>
          )}
          {nights > 1 && room.tong_gia && (
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
              Tổng {nights} đêm: {fmt(room.tong_gia)} ₫
            </p>
          )}
          {query.ngay_nhan && query.ngay_tra && (
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
              {fmtDate(query.ngay_nhan)} – {fmtDate(query.ngay_tra)}
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={handleBook}>
            Đặt phòng ngay
          </button>
        </div>
      </div>

      {room.mo_ta && (
        <div className="hotel-detail-section">
          <h2 className="hotel-detail-section-title">Mô tả phòng</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.7 }}>{room.mo_ta}</p>
        </div>
      )}

      {amenityNames.length > 0 && (
        <div className="hotel-detail-section">
          <h2 className="hotel-detail-section-title">Tiện nghi phòng</h2>
          <ul className="amenity-plain-list">
            {amenityNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="hotel-detail-section">
        <h2 className="hotel-detail-section-title">
          Đánh giá {room.so_danh_gia > 0 ? `(${room.so_danh_gia})` : ''}
        </h2>
        {reviews.length === 0 ? (
          <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Chưa có đánh giá cho loại phòng này</p>
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
      </div>
    </div>
  );
};

export default CustomerRoomDetailPage;
