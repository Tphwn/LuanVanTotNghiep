import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';

export const AmenityFormModal = ({
  isOpen,
  editId,
  form,
  activeTab,
  onClose,
  onSubmit,
  onNameChange,
  onLoaiChange,
}) => {
  if (!isOpen) return null;

  const PreviewIcon = getAmenityLucideIcon(form.ten || form.bieu_tuong);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editId ? 'Chỉnh sửa tiện nghi' : 'Thêm tiện nghi mới'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
            Tên tiện nghi <span style={{ color: '#e05c5c' }}>*</span>
          </label>
          <div className="amenity-form-name-row">
            <div className="amenity-form-icon-preview">
              <PreviewIcon size={24} strokeWidth={1.5} />
            </div>
            <input
              className="search-input"
              style={{ flex: 1, boxSizing: 'border-box' }}
              placeholder={activeTab === 'hotel' ? 'VD: Hồ bơi, Ô tô, Bãi đỗ xe...' : 'VD: Tủ lạnh, Ban công...'}
              value={form.ten}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
            />
          </div>
          {form.ten && (
            <div className="amenity-form-icon-hint">
              <PreviewIcon size={12} strokeWidth={2} />
              Icon nhận diện 
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
            Áp dụng cho
          </label>
          <div className="amenity-form-scope-row">
            {[
              { value: 'khach_san', label: 'Khách sạn', desc: 'Hiển thị cho khách sạn' },
              { value: 'phong', label: 'Loại phòng', desc: 'Hiển thị cho loại phòng' },
              { value: 'ca_hai', label: 'Cả hai', desc: 'Khách sạn & Loại phòng' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                className={`amenity-scope-btn${form.loai === value ? ' active' : ''}`}
                onClick={() => onLoaiChange(value)}
              >
                <span className="amenity-scope-label">{label}</span>
                <span className="amenity-scope-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>
            {editId ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
