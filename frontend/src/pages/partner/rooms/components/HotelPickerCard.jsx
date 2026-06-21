import { Building2 } from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import { HOTEL_STATUS } from '../constants';
import { getMainImage } from '../utils';

export default function HotelPickerCard({ hotel, stats, selected, onSelect }) {
  const thumb = getMainImage(hotel);
  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const isSelected = String(selected) === String(hotel.ma_khach_san);

  return (
    <button
      type="button"
      onClick={() => onSelect(hotel.ma_khach_san)}
      className={`hotel-picker-card${isSelected ? ' selected' : ''}`}
    >
      <div className="hotel-picker-thumb">
        {thumb ? (
          <img src={resolveUploadUrl(thumb.url)} alt="" />
        ) : (
          <Building2 size={36} strokeWidth={1} style={{ color: '#3C7363' }} />
        )}
        <span className={`badge ${st.cls}`} style={{ position: 'absolute', top: 8, right: 8 }}>
          {st.label}
        </span>
      </div>
      <div className="hotel-picker-info">
        <div className="hotel-picker-name">{hotel.ten}</div>
        <div className="hotel-picker-location">{hotel.dia_diem?.ten_dia_diem || '—'}</div>
        <div className="hotel-picker-stats">
          <span style={{ color: '#3C7363', fontWeight: 600 }}>{stats?.total ?? 0} loại phòng</span>
          <span style={{ color: '#52c41a', fontWeight: 600 }}>{stats?.active ?? 0} đang bán</span>
        </div>
      </div>
    </button>
  );
}
