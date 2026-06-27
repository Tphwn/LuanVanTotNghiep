import { Pencil } from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import ActionButton from '../../../../components/common/ActionButton';
import ToggleSwitch from '../../../../components/common/management/ToggleSwitch';
import { TRANG_THAI } from '../constants';
import InfoRow from './InfoRow';
import { HotelAmenityDisplay } from './HotelAmenityGroups';

export default function HotelDetailModal({ hotel, onClose, onEdit, onToggle }) {
  if (!hotel) return null;
  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const mainImg = hotel.hinh_anh?.find((i) => i.la_anh_chinh === 1) || hotel.hinh_anh?.[0];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <div
        className="modal-box"
        style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="modal-title" style={{ margin: 0, color: '#1a2e28' }}>{hotel.ten}</h3>
          <button type="button" className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {mainImg && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/7' }}>
            <img src={resolveUploadUrl(mainImg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionButton variant="edit" icon={Pencil} onClick={onEdit}>Chỉnh sửa</ActionButton>
            {['hoat_dong', 'bi_khoa'].includes(hotel.trang_thai) && (
              <ToggleSwitch
                checked={hotel.trang_thai === 'hoat_dong'}
                onChange={onToggle}
                labelOn="Đang hoạt động"
                labelOff="Tạm ngừng"
              />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <InfoRow label="Tên khách sạn" value={hotel.ten} />
            <InfoRow label="Địa điểm" value={hotel.dia_diem?.ten_dia_diem} />
            <InfoRow label="Xếp hạng" value={hotel.so_sao ? `${hotel.so_sao} Sao` : '—'} />
          </div>
          <div>
            <InfoRow label="Giờ nhận phòng" value={hotel.gio_nhan_phong ? new Date(hotel.gio_nhan_phong).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoRow label="Giờ trả phòng" value={hotel.gio_tra_phong ? new Date(hotel.gio_tra_phong).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoRow label="Trạng thái" value={st.label} />
          </div>
        </div>

        <InfoRow label="Địa chỉ cụ thể" value={hotel.dia_chi} />

        {hotel.mo_ta && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fdfb', borderRadius: 8, fontSize: 14, color: '#5a7a72' }}>
            {hotel.mo_ta}
          </div>
        )}

        {hotel.khach_san_tien_nghi?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>Tiện nghi khách sạn</div>
            <HotelAmenityDisplay items={hotel.khach_san_tien_nghi} />
          </div>
        )}
      </div>
    </div>
  );
}
