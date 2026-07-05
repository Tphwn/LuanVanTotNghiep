import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import RoomSpecs from './RoomSpecs';
import CustomerButton from './CustomerButton';
import CustomerAmenityTags from './CustomerAmenityTags';
import CustomerPriceOffer from './CustomerPriceOffer';
import RoomDetailModal from './RoomDetailModal';
import { resolveUploadUrl } from '../../utils/media';

const MAX_ROOM_AMENITIES = 5;

const RoomOfferCard = ({
  room,
  soPhong = 1,
  onBook,
}) => {
  const images = room.hinh_anh?.length ? room.hinh_anh : [];
  const [imgIdx, setImgIdx] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const currentImg = images[imgIdx] || images.find((i) => i.la_anh_chinh) || images[0];
  const roomsLeft = room.phong_con_lai ?? null;
  const isSoldOut = roomsLeft == null || roomsLeft < soPhong;

  const prevImg = () => setImgIdx((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  const nextImg = () => setImgIdx((i) => (images.length ? (i + 1) % images.length : 0));

  const openDetail = () => setDetailOpen(true);

  return (
    <>
      <article className={`hotel-room-offer-card${isSoldOut ? ' hotel-room-offer-card--sold-out' : ''}`}>
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
          <button type="button" className="hotel-room-offer-detail-link" onClick={openDetail}>
            Chi tiết phòng
          </button>
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
            moreOnClick={openDetail}
            className="hotel-room-offer-amenities customer-amenity-tags"
          />
        </div>

        <div className="hotel-room-offer-aside">
          <CustomerPriceOffer
            amount={room.gia_hien_thi}
            originalAmount={room.gia_goc}
            label=""
            suffix="/ phòng / đêm"
            className="hotel-room-offer-price-wrap"
          />
          {!room.gia_goc && (
            <p className="hotel-room-offer-tax-note">(Chưa bao gồm thuế và phí)</p>
          )}
          {roomsLeft != null && (
            <p className={`hotel-room-offer-stock${isSoldOut ? ' hotel-room-offer-stock--sold-out' : ''}`}>
              {isSoldOut ? 'Hết phòng' : `Còn ${roomsLeft} phòng`}
            </p>
          )}
          <CustomerButton
            className="hotel-room-offer-cta"
            disabled={isSoldOut}
            onClick={() => !isSoldOut && onBook(room.ma_loai_phong)}
          >
            {isSoldOut ? 'Hết phòng' : 'Đặt phòng ngay'}
          </CustomerButton>
        </div>
      </article>

      <RoomDetailModal
        room={room}
        soPhong={soPhong}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
};

export default RoomOfferCard;
