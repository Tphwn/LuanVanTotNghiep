import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import RoomSpecs from './RoomSpecs';
import CustomerButton from './CustomerButton';
import CustomerAmenityTags from './CustomerAmenityTags';
import CustomerPrice from './CustomerPrice';
import { resolveUploadUrl } from '../../utils/media';

const MAX_ROOM_AMENITIES = 5;

const RoomOfferCard = ({
  room,
  buildRoomUrl,
  onBook,
}) => {
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const [imgIdx, setImgIdx] = useState(0);
  const currentImg = images[imgIdx] || images.find((i) => i.la_anh_chinh) || images[0];
  const roomDetailUrl = buildRoomUrl(room.ma_loai_phong);

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
              <div className="hotel-room-offer-dots">
                {images.map((img, i) => (
                  <button
                    key={img.ma_hinh_anh || i}
                    type="button"
                    className={`hotel-room-offer-dot${i === imgIdx ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Ảnh ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <Link to={roomDetailUrl} className="hotel-room-offer-detail-link">
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
        <CustomerAmenityTags
          items={room.tien_nghi || []}
          max={MAX_ROOM_AMENITIES}
          moreTo={roomDetailUrl}
          className="hotel-room-offer-amenities customer-amenity-tags"
        />
      </div>

      <div className="hotel-room-offer-aside">
        <CustomerPrice amount={room.gia_hien_thi} className="hotel-room-offer-price" />
        <p className="hotel-room-offer-tax-note">(Chưa bao gồm thuế và phí)</p>
        {room.phong_con_lai != null && room.so_luong_phong != null && (
          <p className="hotel-room-offer-stock">Còn {room.phong_con_lai}/{room.so_luong_phong} phòng</p>
        )}
        <CustomerButton
          className="hotel-room-offer-cta"
          onClick={() => onBook(room.ma_loai_phong)}
        >
          Đặt phòng ngay
        </CustomerButton>
      </div>
    </article>
  );
};

export default RoomOfferCard;
