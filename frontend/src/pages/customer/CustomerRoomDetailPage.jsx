import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'});
};

const buildQueryString = (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
};

const buildRoomUrl = (hotelId, roomId, query) => {
  const qs = buildQueryString(query);
  return `/hotels/${hotelId}/rooms/${roomId}${qs ? `?${qs}` :''}`;
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
    return `${ROUTES.CUSTOMER.HOTELS}${qs ? `?${qs}` : ''}`;
  }, [query]);

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
        <div className="content-card"style={{ textAlign: 'center', padding: 64, color: '#5a7a72'}}>
           Đang tải chi tiết loại phòng...
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card"style={{ textAlign:'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}> {error || 'Không tìm thấy loại phòng'}</p>
          <Link to={backUrl} className="btn btn-outline">← Quay lại kết quả</Link>
        </div>
      </div>
    );
  }

  const hotel = room.khach_san;
  const images = room.hinh_anh?.length ? room.hinh_anh : (hotel?.hinh_anh || []);
  const mainImg = images[activeImg] || images[0];
  const otherRooms = room.loai_phong_khac || [];

  return (
    <div className="hotel-detail-page">
      <Link to={backUrl} className="btn btn-ghost btn-sm"style={{ marginBottom: 16 }}>
        ← Quay lại kết quả tìm kiếm
      </Link>

      <div className="hotel-detail-gallery">
        {mainImg ? (
          <img
            src={resolveUploadUrl(mainImg.url)}
            alt={room.ten_loai}
            className="hotel-detail-main-img"/>
        ) : (
          <div className="hotel-detail-main-img hotel-detail-img-placeholder"></div>
        )}
        {images.length > 1 && (
          <div className="hotel-detail-thumbs">
            {images.map((img, i) => (
              <button
                key={img.ma_hinh_anh || i}
                type="button"className={`hotel-detail-thumb${i === activeImg ? 'active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={resolveUploadUrl(img.url)} alt=""/>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hotel-detail-header">
        <div>
          <p className="room-detail-hotel-label"> {hotel?.ten}</p>
          <h1 className="hotel-detail-name">{room.ten_loai}</h1>
          <p className="hotel-detail-location">
             {hotel?.dia_diem?.ten_dia_diem} · {hotel?.dia_chi}
          </p>
          {hotel?.so_sao > 0 && (
            <div className="hotel-result-stars"style={{ marginTop: 8 }}>
              {''.repeat(hotel.so_sao)} · {hotel.so_sao} sao
            </div>
          )}
          <div className="hotel-detail-room-meta"style={{ marginTop: 12 }}>
            <span> Tối đa {room.suc_chua} khách</span>
            {room.dien_tich && <span> {room.dien_tich} m²</span>}
            {room.so_giuong && <span> {room.so_giuong} giường</span>}
            {room.phong_con_lai != null && (
              <span className="badge badge-success">Còn {room.phong_con_lai} phòng</span>
            )}
          </div>
        </div>

        <div className="hotel-detail-booking-info">
          <div className="hotel-detail-room-price-night"style={{ fontSize: 22 }}>
            {fmt(room.gia_hien_thi)} ₫<span>/đêm</span>
          </div>
          {nights > 1 && room.tong_gia && (
            <div className="hotel-detail-room-total"style={{ marginTop: 6 }}>
              Tổng {nights} đêm: <strong>{fmt(room.tong_gia)} ₫</strong>
            </div>
          )}
          {query.ngay_nhan && query.ngay_tra && (
            <>
              <div className="hotel-detail-booking-label"style={{ marginTop: 12 }}>Thời gian lưu trú</div>
              <div className="hotel-detail-booking-value">
                {fmtDate(query.ngay_nhan)} → {fmtDate(query.ngay_tra)}
              </div>
              <div className="hotel-detail-booking-sub">
                {nights} đêm · {query.so_khach} khách
              </div>
            </>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: '#5a7a72'}}>
            Nhận phòng {formatTime(hotel?.gio_nhan_phong)} · Trả phòng {formatTime(hotel?.gio_tra_phong)}
          </div>
          <button type="button"className="btn btn-primary"style={{ marginTop: 16, width:'100%'}} onClick={handleBook}>
            Đặt phòng ngay
          </button>
        </div>
      </div>

      {room.mo_ta && (
        <div className="content-card"style={{ marginBottom: 20 }}>
          <h3 className="content-card-title">Mô tả phòng</h3>
          <p style={{ margin: 0, fontSize: 14, color:'#5a7a72', lineHeight: 1.7 }}>{room.mo_ta}</p>
        </div>
      )}

      {room.tien_nghi?.length > 0 && (
        <div className="content-card"style={{ marginBottom: 20 }}>
          <h3 className="content-card-title">Tiện nghi phòng</h3>
          <div className="hotel-detail-amenities">
            {room.tien_nghi.map((tn) => (
              <span key={tn.ma_tien_nghi || tn.ten} className="hotel-detail-amenity">
                {tn.ten}
              </span>
            ))}
          </div>
        </div>
      )}

      {hotel?.tien_nghi?.length > 0 && (
        <div className="content-card"style={{ marginBottom: 20 }}>
          <h3 className="content-card-title">Tiện nghi khách sạn</h3>
          <div className="hotel-detail-amenities">
            {hotel.tien_nghi.map((tn) => (
              <span key={tn.ma_tien_nghi || tn.ten} className="hotel-detail-amenity">
                {tn.ten}
              </span>
            ))}
          </div>
        </div>
      )}

      {hotel?.mo_ta && (
        <div className="content-card"style={{ marginBottom: 20 }}>
          <h3 className="content-card-title">Về khách sạn</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#5a7a72', lineHeight: 1.7 }}>{hotel.mo_ta}</p>
        </div>
      )}

      {otherRooms.length > 0 && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title"style={{ margin: 0 }}>
               Loại phòng khác tại {hotel?.ten}
            </h3>
          </div>
          <div className="hotel-detail-rooms">
            {otherRooms.map((other) => {
              const otherImg = other.hinh_anh?.find((i) => i.la_anh_chinh) || other.hinh_anh?.[0];
              return (
                <article key={other.ma_loai_phong} className="hotel-detail-room-card">
                  {otherImg ? (
                    <img src={resolveUploadUrl(otherImg.url)} alt={other.ten_loai} className="hotel-detail-room-img"/>
                  ) : (
                    <div className="hotel-detail-room-img hotel-detail-img-placeholder"></div>
                  )}

                  <div className="hotel-detail-room-body">
                    <h4 className="hotel-detail-room-name">{other.ten_loai}</h4>
                    {other.mo_ta && (
                      <p className="hotel-detail-room-desc">{other.mo_ta}</p>
                    )}
                    <div className="hotel-detail-room-meta">
                      <span> Tối đa {other.suc_chua} khách</span>
                      {other.dien_tich && <span> {other.dien_tich} m²</span>}
                      {other.phong_con_lai != null && (
                        <span className="badge badge-success">Còn {other.phong_con_lai} phòng</span>
                      )}
                    </div>
                  </div>

                  <div className="hotel-detail-room-price">
                    <div className="hotel-detail-room-price-night">
                      {fmt(other.gia_hien_thi)} ₫<span>/đêm</span>
                    </div>
                    {nights > 1 && other.tong_gia && (
                      <div className="hotel-detail-room-total">
                        Tổng {nights} đêm: <strong>{fmt(other.tong_gia)} ₫</strong>
                      </div>
                    )}
                    <Link
                      to={buildRoomUrl(hotelId, other.ma_loai_phong, query)}
                      className="btn btn-outline btn-sm"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRoomDetailPage;
