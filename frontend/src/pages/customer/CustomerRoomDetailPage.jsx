import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import RoomSpecs from '../../components/customer/RoomSpecs';
import CustomerAmenityTag from '../../components/customer/CustomerAmenityTag';
import CustomerPriceOffer from '../../components/customer/CustomerPriceOffer';
import publicHotelService from '../../services/publicHotelService';
import { resolveUploadUrl } from '../../utils/media';
import { formatBedLabel } from '../../utils/bedDisplay';
import { resolveSearchForm } from '../../utils/hotelSearchStorage';
import { ROOM_CATEGORY_GROUPS } from '../admin/amenities/constants';
import { groupAmenitiesByCategory } from '../admin/amenities/utils';
import formatCurrency from '../../utils/formatCurrency';
import '../../assets/styles/home.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const buildQueryString = (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
};

const CustomerRoomDetailPage = () => {
  const { hotelId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  const query = useMemo(() => {
    const resolved = resolveSearchForm({
      ma_dia_diem: searchParams.get('ma_dia_diem') || '',
      ngay_nhan: searchParams.get('ngay_nhan') || '',
      ngay_tra: searchParams.get('ngay_tra') || '',
      so_khach: searchParams.get('so_khach') || '',
      tre_em: searchParams.get('tre_em') || '',
      tuoi_tre_em: searchParams.get('tuoi_tre_em') || '',
      so_phong: searchParams.get('so_phong') || '',
    });
    return {
      ma_dia_diem: resolved.ma_dia_diem,
      ngay_nhan: resolved.ngay_nhan,
      ngay_tra: resolved.ngay_tra,
      so_khach: String(resolved.so_khach),
      tre_em: String(resolved.tre_em || 0),
      so_phong: String(resolved.so_phong || 1),
      ...(resolved.tuoi_tre_em?.length
        ? { tuoi_tre_em: resolved.tuoi_tre_em.join(',') }
        : {}),
    };
  }, [searchParams]);

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
  const isSoldOut = (room.phong_con_lai ?? 0) < Number(query.so_phong || 1);
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
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
              bedLabel={room.loai_giuong || formatBedLabel(room)}
            />
            {room.phong_con_lai != null && (
              <p className={`room-detail-stock${isSoldOut ? ' room-detail-stock--sold-out' : ''}`}>
                {isSoldOut ? 'Hết phòng' : `Còn ${room.phong_con_lai} phòng`}
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
                  <div className="room-detail-amenity-tags customer-amenity-tags">
                    {group.items.map((item) => (
                      <CustomerAmenityTag key={item.ma_tien_nghi || item.ten}>
                        {item.ten}
                      </CustomerAmenityTag>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="room-detail-booking room-detail-booking--view-only">
            <CustomerPriceOffer
              amount={room.gia_hien_thi}
              originalAmount={room.gia_goc}
              label="Giá tham khảo:"
              align="left"
              showTaxNote={Boolean(room.gia_goc)}
              className="room-detail-price-row"
            />
            {nights > 1 && room.tong_gia && (
              <p className="room-detail-total">Tổng {nights} đêm: {formatCurrency(room.tong_gia)} VNĐ</p>
            )}
          </div>
        </aside>
      </div>

      {room.mo_ta && (
        <section className="room-detail-section-below">
          <h2 className="room-detail-block-title">Mô tả phòng</h2>
          <p className="room-detail-desc">{room.mo_ta}</p>
        </section>
      )}

    </div>
  );
};

export default CustomerRoomDetailPage;
