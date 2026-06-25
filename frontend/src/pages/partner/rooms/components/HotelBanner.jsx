import { Building2 } from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import { HOTEL_STATUS } from '../constants';
import { getMainImage } from '../utils';

export default function HotelBanner({ hotel, hotelsCount, onChangeHotel }) {
  const mainImg = getMainImage(hotel);

  return (
    <div className="rt-hotel-banner">
      {mainImg ? (
        <img src={resolveUploadUrl(mainImg.url)} alt="" className="rt-hotel-banner-img" />
      ) : (
        <div className="rt-hotel-banner-placeholder">
          <Building2 size={28} strokeWidth={1.2} />
        </div>
      )}
      <div className="rt-hotel-banner-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#1a2e28' }}>{hotel.ten}</h3>
          <span className={`badge ${(HOTEL_STATUS[hotel.trang_thai] || {}).cls || 'badge-default'}`}>
            {(HOTEL_STATUS[hotel.trang_thai] || {}).label || hotel.trang_thai}
          </span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5a7a72' }}>
          {hotel.dia_diem?.ten_dia_diem} — {hotel.dia_chi || 'Chưa cập nhật địa chỉ'}
        </p>
      </div>
      {hotelsCount > 1 && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onChangeHotel}>
          ← Quay lại
        </button>
      )}
    </div>
  );
}
