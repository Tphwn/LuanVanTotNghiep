import { Pencil, Trash2, Plus } from 'lucide-react';
import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';

export const AmenityGroupCard = ({ group, onEdit, onDelete, onAdd }) => (
  <div className="amenity-group-card">
    <div className="amenity-group-header">
      <div className="amenity-group-icon-wrap">
        <group.Icon size={17} strokeWidth={1.5} />
      </div>
      <div>
        <div className="amenity-group-title">{group.label}</div>
        <div className="amenity-group-sub">{group.items.length} tiện nghi</div>
      </div>
    </div>
    <div className="amenity-group-list">
      {group.items.length === 0 ? (
        <div className="amenity-group-empty">Chưa có tiện nghi</div>
      ) : (
          group.items.map((item) => {
            const ItemIcon = getAmenityLucideIcon(item.bieu_tuong || item.ten);
            return (
            <div key={item.ma_tien_nghi} className="amenity-group-item">
              <ItemIcon size={15} strokeWidth={1.6} className="amenity-group-item-icon" />
              <span className="amenity-group-item-name">{item.ten}</span>
            {(item._count || item.so_luong) != null && (
              <span className="amenity-group-item-count">
                {item._count?.total ?? item._count ?? item.so_luong}
              </span>
            )}
            <div className="amenity-group-item-btns">
              <button
                type="button"
                className="amenity-icon-btn amenity-icon-btn-edit"
                title="Sửa"
                onClick={() => onEdit(item)}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="amenity-icon-btn amenity-icon-btn-delete"
                title="Xóa"
                onClick={() => onDelete(item.ma_tien_nghi)}
              >
                <Trash2 size={13} />
              </button>
            </div>
            </div>
          );})
        )}
      </div>
      <button type="button" className="amenity-group-add-btn" onClick={onAdd}>
      <Plus size={14} />
      Thêm tiện nghi
    </button>
  </div>
);
