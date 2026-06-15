import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import { getAmenityIcon } from '../../utils/amenityIcons';
import ROUTES from '../../constants/routes';
import '../../assets/styles/home.css';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const CustomerHotelDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState(null);
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
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
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

  if (loading) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 64, color: '#5a7a72' }}>
          ⏳ Đang tải chi tiết khách sạn...
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}>⚠️ {error || 'Không tìm thấy khách sạn'}</p>
          <Link to={backUrl} className="btn btn-outline">← Quay lại kết quả</Link>
        </div>
      </div>
    );
  }

  const images = hotel.hinh_anh || [];
  const mainImg = images[activeImg] || images[0];

  return (
    <div className="hotel-detail-page">
      <Link to={backUrl} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        ← Quay lại kết quả tìm kiếm
      </Link>

      <div className="hotel-detail-gallery">
        {mainImg ? (
          <img
            src={resolveUploadUrl(mainImg.url)}
            alt={hotel.ten}
            className="hotel-detail-main-img"
          />
        ) : (
          <div className="hotel-detail-main-img hotel-detail-img-placeholder">🏨</div>
        )}
        {images.length > 1 && (
          <div className="hotel-detail-thumbs">
            {images.map((img, i) => (
              <button
                key={img.ma_hinh_anh}
                type="button"
                className={`hotel-detail-thumb${i === activeImg ? ' active' : ''}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={resolveUploadUrl(img.url)} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hotel-detail-header">
        <div>
          <h1 className="hotel-detail-name">{hotel.ten}</h1>
          <p className="hotel-detail-location">
            📍 {hotel.dia_diem?.ten_dia_diem} · {hotel.dia_chi}
          </p>
          {hotel.so_sao > 0 && (
            <div className="hotel-result-stars" style={{ marginTop: 8 }}>
              {'⭐'.repeat(hotel.so_sao)} · {hotel.so_sao} sao
            </div>
          )}
        </div>
        <div className="hotel-detail-booking-info">
          {query.ngay_nhan && query.ngay_tra && (
            <>
              <div className="hotel-detail-booking-label">Thời gian lưu trú</div>
              <div className="hotel-detail-booking-value">
                {fmtDate(query.ngay_nhan)} → {fmtDate(query.ngay_tra)}
              </div>
              <div className="hotel-detail-booking-sub">
                {nights} đêm · {query.so_khach} khách
              </div>
            </>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: '#5a7a72' }}>
            Nhận phòng {formatTime(hotel.gio_nhan_phong)} · Trả phòng {formatTime(hotel.gio_tra_phong)}
          </div>
        </div>
      </div>

      {hotel.mo_ta && (
        <div className="content-card" style={{ marginBottom: 20 }}>
          <h3 className="content-card-title">Giới thiệu</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#5a7a72', lineHeight: 1.7 }}>{hotel.mo_ta}</p>
        </div>
      )}

      {hotel.tien_nghi?.length > 0 && (
        <div className="content-card" style={{ marginBottom: 20 }}>
          <h3 className="content-card-title">Tiện nghi khách sạn</h3>
          <div className="hotel-detail-amenities">
            {hotel.tien_nghi.map((tn) => (
              <span key={tn.ma_tien_nghi || tn.ten} className="hotel-detail-amenity">
                {getAmenityIcon(tn.bieu_tuong, tn.ten)} {tn.ten}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title" style={{ margin: 0 }}>
            🛏️ Loại phòng ({hotel.loai_phong?.length || 0})
          </h3>
          {hotel.gia_tu && (
            <span style={{ fontSize: 13, color: '#5a7a72' }}>
              Giá từ <strong style={{ color: '#b36b00' }}>{fmt(hotel.gia_tu)} ₫</strong>/đêm
            </span>
          )}
        </div>

        {!hotel.loai_phong?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛏️</div>
            <p className="empty-state-text">Không có phòng trống cho khoảng thời gian đã chọn</p>
          </div>
        ) : (
          <div className="hotel-detail-rooms">
            {hotel.loai_phong.map((room) => {
              const roomImg = room.hinh_anh?.find((i) => i.la_anh_chinh) || room.hinh_anh?.[0];
              return (
                <article key={room.ma_loai_phong} className="hotel-detail-room-card">
                  {roomImg ? (
                    <img src={resolveUploadUrl(roomImg.url)} alt={room.ten_loai} className="hotel-detail-room-img" />
                  ) : (
                    <div className="hotel-detail-room-img hotel-detail-img-placeholder">🛏️</div>
                  )}

                  <div className="hotel-detail-room-body">
                    <h4 className="hotel-detail-room-name">{room.ten_loai}</h4>
                    {room.mo_ta && (
                      <p className="hotel-detail-room-desc">{room.mo_ta}</p>
                    )}
                    <div className="hotel-detail-room-meta">
                      <span>👥 Tối đa {room.suc_chua} khách</span>
                      {room.dien_tich && <span>📐 {room.dien_tich} m²</span>}
                      {room.so_giuong && <span>🛏️ {room.so_giuong} giường</span>}
                      {room.phong_con_lai != null && (
                        <span className="badge badge-success">Còn {room.phong_con_lai} phòng</span>
                      )}
                    </div>
                  </div>

                  <div className="hotel-detail-room-price">
                    <div className="hotel-detail-room-price-night">
                      {fmt(room.gia_hien_thi)} ₫<span>/đêm</span>
                    </div>
                    {nights > 1 && room.tong_gia && (
                      <div className="hotel-detail-room-total">
                        Tổng {nights} đêm: <strong>{fmt(room.tong_gia)} ₫</strong>
                      </div>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" disabled title="Sắp ra mắt">
                      Đặt phòng
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHotelDetailPage;
