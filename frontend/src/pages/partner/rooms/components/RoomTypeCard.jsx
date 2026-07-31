import { resolveUploadUrl } from '../../../../utils/media';
import {
  Pencil, Lock, Unlock, Plus, BedDouble,
  DollarSign, Maximize2, Users, FileText, Sparkles,
  Camera, Home, Check, Star,
} from 'lucide-react';
import { TRANG_THAI } from '../constants';
import { fmt, getMainImage } from '../utils';
import { formatBedLabel } from '../../../../utils/bedDisplay';

export default function RoomTypeCard({ room, onEdit, onToggle, onManageImages }) {
  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
  const isActive = room.trang_thai === 'hoat_dong';
  const allImgs = room.hinh_anh || [];
  const mainImg = getMainImage(room);
  const otherImgs = allImgs.filter((i) => i !== mainImg).slice(0, 3);

  return (
    <div className={`rt-card${!isActive ? ' rt-card-inactive' : ''}`}>
      <div className="rt-card-header">
        <div className="rt-card-name-row">
          <Star size={13} strokeWidth={2.5} className="rt-card-star" />
          <span className="rt-card-name-label">LOẠI PHÒNG:</span>
          <strong className="rt-card-name">{room.ten_loai.toUpperCase()}</strong>
        </div>
        <div className="rt-card-header-right">
          <span className={`badge ${st.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {st.label}
            {isActive && <span className="rt-status-dot" />}
          </span>
          <button type="button" className="rt-action-btn rt-action-edit" onClick={onEdit}>
            <Pencil size={13} strokeWidth={2} /> Sửa
          </button>
          <button
            type="button"
            className={`rt-action-btn ${isActive ? 'rt-action-lock' : 'rt-action-unlock'}`}
            onClick={onToggle}
          >
            {isActive ? <Lock size={13} strokeWidth={2} /> : <Unlock size={13} strokeWidth={2} />}
            {isActive ? 'Ẩn' : 'Mở'}
          </button>
        </div>
      </div>

      <div className="rt-card-body">
        <div className="rt-card-images">
          <div className="rt-main-img-wrap">
            {mainImg ? (
              <img src={resolveUploadUrl(mainImg.url)} alt={room.ten_loai} className="rt-main-img" />
            ) : (
              <div className="rt-main-img-empty">
                <BedDouble size={44} strokeWidth={1} />
                <span>Chưa có ảnh</span>
              </div>
            )}
            <button type="button" className="rt-change-img-btn" onClick={onManageImages}>
              <Camera size={12} /> Đổi ảnh
            </button>
          </div>
          <div className="rt-thumb-strip">
            {otherImgs.map((img, i) => (
              <div key={i} className="rt-thumb" onClick={onManageImages} role="button" tabIndex={0} onKeyDown={() => {}}>
                <img src={resolveUploadUrl(img.url)} alt="" />
              </div>
            ))}
            <button type="button" className="rt-thumb-add" onClick={onManageImages}>
              <Plus size={16} />
              <span style={{ fontSize: 10, marginTop: 2 }}>Thêm</span>
            </button>
          </div>
        </div>

        <div className="rt-card-details">
          <div className="rt-detail-row rt-detail-price">
            <DollarSign size={15} strokeWidth={1.8} />
            <span><strong>Giá cơ bản:</strong> {fmt(room.gia_co_ban)} VNĐ / đêm</span>
          </div>
          <div className="rt-detail-row">
            <Maximize2 size={14} strokeWidth={1.8} />
            <span><strong>Diện tích:</strong> {room.dien_tich ? `${room.dien_tich} m²` : '—'}</span>
          </div>
          <div className="rt-detail-row">
            <Users size={14} strokeWidth={1.8} />
            <span><strong>Sức chứa:</strong> {room.suc_chua} người lớn</span>
          </div>
          <div className="rt-detail-row">
            <BedDouble size={14} strokeWidth={1.8} />
            <span><strong>Số giường:</strong> {room.loai_giuong || formatBedLabel(room)}</span>
          </div>
          <div className="rt-detail-row">
            <Home size={14} strokeWidth={1.8} />
            <span>
              <strong>Số phòng:</strong>{' '}
              {room.so_luong_phong ?? 0} phòng
            </span>
          </div>
          {room.mo_ta && (
            <div className="rt-detail-row rt-detail-desc">
              <FileText size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong>Mô tả:</strong> {room.mo_ta}</span>
            </div>
          )}
        </div>
      </div>

      {(room.loai_phong_tien_nghi?.length > 0) && (
        <div className="rt-amenities-section">
          <div className="rt-section-label">
            <Sparkles size={12} strokeWidth={2} />
            TIỆN NGHI PHÒNG NÀY ĐANG CÓ:
          </div>
          <div className="rt-amenity-chips">
            {room.loai_phong_tien_nghi.map((tn) => (
              <span key={tn.ma_tien_nghi} className="rt-amenity-chip">
                <Check size={11} strokeWidth={2.5} />
                {tn.tien_nghi?.ten}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
