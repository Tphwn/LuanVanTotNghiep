import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble, Maximize2, Users, Home, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import { TRANG_THAI } from '../constants';
import { fmt } from '../utils';
import { ROOM_CATEGORY_GROUPS } from '../../../admin/amenities/constants';
import { groupAmenitiesByCategory } from '../../../admin/amenities/utils';

export default function RoomDetailModal({ room, onClose }) {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!room) return undefined;
    setActiveImg(0);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [room, onClose]);

  const amenityGroups = useMemo(() => {
    if (!room) return [];
    const items = (room.loai_phong_tien_nghi || [])
      .map((tn) => tn.tien_nghi)
      .filter(Boolean);
    return groupAmenitiesByCategory(items, ROOM_CATEGORY_GROUPS).filter((g) => g.items.length > 0);
  }, [room]);

  if (!room) return null;

  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai };
  const isActive = room.trang_thai === 'hoat_dong';
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
  const moBan = room.so_luong_mo_ban ?? room.phong_con_lai ?? 0;
  const tongPhong = room.so_luong_phong ?? 0;

  const prevImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i + 1) % images.length);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box partner-room-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-room-detail-title"
      >
        <div className="partner-room-detail-head">
          <h3 id="partner-room-detail-title" className="partner-room-detail-title">
            {room.ten_loai}
          </h3>
          <span className={`partner-room-status ${isActive ? 'partner-room-status--active' : 'partner-room-status--inactive'}`}>
            {st.label}
          </span>
        </div>

        <div className="partner-room-detail-gallery">
          <div className="partner-room-detail-main-view">
            {currentImg ? (
              <img
                src={resolveUploadUrl(currentImg.url)}
                alt={room.ten_loai}
              />
            ) : (
              <div className="partner-room-detail-main-img--empty">
                <BedDouble size={40} strokeWidth={1.2} />
                <span>Chưa có ảnh</span>
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="partner-room-detail-nav partner-room-detail-nav--prev"
                  onClick={prevImg}
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className="partner-room-detail-nav partner-room-detail-nav--next"
                  onClick={nextImg}
                  aria-label="Ảnh sau"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {images.length > 0 && (
            <div className="partner-room-detail-thumb-row">
              {images.map((img, i) => (
                <button
                  key={img.ma_hinh_anh || i}
                  type="button"
                  className={`partner-room-detail-thumb${i === activeImg ? ' active' : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={resolveUploadUrl(img.url)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="partner-room-detail-grid">
          <div className="partner-room-detail-item">
            <Maximize2 size={16} strokeWidth={1.75} />
            <span>Diện tích: <strong>{room.dien_tich ? `${room.dien_tich} m²` : '—'}</strong></span>
          </div>
          <div className="partner-room-detail-item">
            <Users size={16} strokeWidth={1.75} />
            <span>Sức chứa: <strong>{room.suc_chua} người lớn</strong></span>
          </div>
          <div className="partner-room-detail-item">
            <BedDouble size={16} strokeWidth={1.75} />
            <span>Số giường: <strong>{room.so_giuong}</strong></span>
          </div>
          <div className="partner-room-detail-item">
            <Home size={16} strokeWidth={1.75} />
            <span>Số phòng: <strong>{moBan}/{tongPhong}</strong></span>
          </div>
        </div>

        {amenityGroups.length > 0 && (
          <div className="partner-room-detail-block">
            <div className="partner-room-detail-block-title">
              <Sparkles size={15} strokeWidth={1.75} />
              Tiện nghi
            </div>
            <div className="partner-room-detail-amenity-groups">
              {amenityGroups.map((group) => (
                <div key={group.id} className="partner-room-detail-amenity-group">
                  <h4 className="partner-room-detail-amenity-group-title">{group.label}</h4>
                  <div className="partner-room-detail-amenity-list">
                    {group.items.map((item) => (
                      <span key={item.ma_tien_nghi} className="partner-room-detail-amenity-tag">
                        {item.ten}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.mo_ta && (
          <div className="partner-room-detail-block">
            <p className="partner-room-detail-text">{room.mo_ta}</p>
          </div>
        )}

        <div className="partner-room-detail-bottom">
          <div className="partner-room-detail-price-row">
            <span className="partner-room-detail-price-label">Giá phòng:</span>
            <span className="partner-room-detail-price">{fmt(room.gia_co_ban)} VNĐ / đêm</span>
          </div>
          <button type="button" className="btn btn-ghost partner-room-detail-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
