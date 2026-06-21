import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';
import { LOAI_LABEL } from '../constants';
import { inferLoaiDeXuat } from '../utils';

export const ApproveRequestModal = ({
  request,
  approveForm,
  onClose,
  onSubmit,
  onLoaiChange,
}) => {
  if (!request) return null;

  const ApproveIcon = getAmenityLucideIcon(request.ten_de_xuat);
  const loaiDx = inferLoaiDeXuat(request);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Duyệt đề xuất tiện nghi</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="amenity-approve-preview">
          <div className="amenity-approve-icon">
            <ApproveIcon size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1a2e28' }}>{request.ten_de_xuat}</div>
            <div style={{ fontSize: 13, color: '#5a7a72', marginTop: 3 }}>
              Đề xuất bởi {request.doi_tac?.ten_cong_ty}
              {loaiDx && (
                <span style={{ marginLeft: 8 }} className={`badge ${LOAI_LABEL[loaiDx]?.cls}`}>
                  {LOAI_LABEL[loaiDx]?.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
            Áp dụng cho
          </label>
          <div className="amenity-form-scope-row">
            {[
              { value: 'khach_san', label: 'Khách sạn', desc: 'Hiển thị khi tạo khách sạn' },
              { value: 'phong', label: 'Loại phòng', desc: 'Hiển thị khi tạo loại phòng' },
              { value: 'ca_hai', label: 'Cả hai', desc: 'Khách sạn & loại phòng' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                className={`amenity-scope-btn${approveForm.loai === value ? ' active' : ''}`}
                onClick={() => onLoaiChange(value)}
              >
                <span className="amenity-scope-label">{label}</span>
                <span className="amenity-scope-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>Xác nhận duyệt</button>
        </div>
      </div>
    </div>
  );
};
