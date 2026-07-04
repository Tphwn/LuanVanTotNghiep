import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, BedDouble, Users } from 'lucide-react';
import CustomerPrice from './CustomerPrice';
import { resolveUploadUrl } from '../../utils/media';

const getBedLabel = (soGiuong) => {
  const n = Number(soGiuong) || 1;
  if (n === 1) return '1 giường đôi';
  if (n === 2) return '2 giường đơn';
  return `${n} giường`;
};

const getAmenityName = (item) => (typeof item === 'string' ? item : item?.ten || '');

const RoomDetailModal = ({
  room,
  soPhong = 1,
  open,
  onClose,
}) => {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    setActiveImg(0);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !room) return null;

  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
  const amenities = room.tien_nghi || [];
  const featuredAmenities = amenities.slice(0, 5);
  const roomsLeft = room.phong_con_lai ?? null;
  const isSoldOut = roomsLeft == null || roomsLeft < soPhong;

  const prevImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i + 1) % images.length);
  };

  return (
    <div className="modal-overlay room-detail-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="room-detail-modal-popup"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-detail-modal-title"
      >
        <div className="room-detail-modal-body">
          <div className="room-detail-modal-gallery">
            <div className="room-detail-modal-main-view">
              {currentImg ? (
                <img src={resolveUploadUrl(currentImg.url)} alt={room.ten_loai} />
              ) : (
                <div className="room-detail-modal-placeholder" />
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="room-detail-modal-nav room-detail-modal-nav--prev"
                    onClick={prevImg}
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    className="room-detail-modal-nav room-detail-modal-nav--next"
                    onClick={nextImg}
                    aria-label="Ảnh sau"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
              {images.length > 0 && (
                <div className="room-detail-modal-img-bar">
                  <span>Phòng</span>
                  <span>{activeImg + 1}/{images.length}</span>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="room-detail-modal-thumb-row">
                {images.map((img, i) => (
                  <button
                    key={img.ma_hinh_anh || i}
                    type="button"
                    className={`room-detail-modal-thumb${i === activeImg ? ' active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={resolveUploadUrl(img.url)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="room-detail-modal-panel">
            <div className="room-detail-modal-header">
              <div>
                <p className="room-detail-modal-eyebrow">Chi tiết loại phòng</p>
                <h2 id="room-detail-modal-title" className="room-detail-modal-title">
                  {room.ten_loai}
                </h2>
              </div>
              <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className="room-detail-modal-scroll">
              <section className="room-detail-modal-section">
                <h3 className="room-detail-modal-section-title">Thông tin phòng</h3>
                <ul className="room-detail-modal-specs">
                  {room.dien_tich != null && (
                    <li>
                      <Maximize2 size={18} strokeWidth={1.75} aria-hidden />
                      <span>{Number(room.dien_tich).toFixed(1)} m²</span>
                    </li>
                  )}
                  {room.so_giuong != null && (
                    <li>
                      <BedDouble size={18} strokeWidth={1.75} aria-hidden />
                      <span>{getBedLabel(room.so_giuong)}</span>
                    </li>
                  )}
                  {room.suc_chua != null && (
                    <li>
                      <Users size={18} strokeWidth={1.75} aria-hidden />
                      <span>{room.suc_chua} khách</span>
                    </li>
                  )}
                </ul>
                {roomsLeft != null && (
                  <p className={`room-detail-modal-stock${isSoldOut ? ' room-detail-modal-stock--sold-out' : ''}`}>
                    {isSoldOut ? 'Hết phòng' : `Còn ${roomsLeft} phòng`}
                  </p>
                )}
              </section>

              {featuredAmenities.length > 0 && (
                <section className="room-detail-modal-section">
                  <h3 className="room-detail-modal-section-title">Tính năng phòng bạn thích</h3>
                  <ul className="room-detail-modal-featured">
                    {featuredAmenities.map((item, i) => (
                      <li key={item.ma_tien_nghi || item.ten || i}>
                        <span className="room-detail-modal-featured-dot" aria-hidden />
                        <span>{getAmenityName(item)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {amenities.length > 0 && (
                <section className="room-detail-modal-section">
                  <h3 className="room-detail-modal-section-title">Tiện nghi phòng</h3>
                  <ul className="room-detail-modal-amenity-grid">
                    {amenities.map((item, i) => (
                      <li key={item.ma_tien_nghi || item.ten || i}>{getAmenityName(item)}</li>
                    ))}
                  </ul>
                </section>
              )}

              {room.mo_ta && (
                <section className="room-detail-modal-section">
                  <h3 className="room-detail-modal-section-title">Mô tả</h3>
                  <p className="room-detail-modal-desc">{room.mo_ta}</p>
                </section>
              )}
            </div>

            <div className="room-detail-modal-popup-footer">
              {room.gia_hien_thi != null && (
                <div className="room-detail-modal-price-section">
                  <span className="room-detail-modal-price-label">Giá tham khảo</span>
                  <div className="room-detail-modal-price-row">
                    <CustomerPrice amount={room.gia_hien_thi} className="room-detail-modal-price-value" />
                    <span className="room-detail-modal-price-unit">/ Phòng / đêm</span>
                  </div>
                  <p className="room-detail-modal-tax-note">(Chưa bao gồm thuế và phí)</p>
                </div>
              )}
              <button type="button" className="room-detail-modal-close-btn" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;
