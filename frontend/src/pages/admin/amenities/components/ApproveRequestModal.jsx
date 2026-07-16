import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';
import { LOAI_LABEL } from '../constants';
import { getPartnerRequestNote, inferLoaiDeXuat } from '../utils';

const TARGET_TAB_HINT = {
  khach_san: 'tiện nghi khách sạn',
  phong: 'tiện nghi loại phòng',
  ca_hai: 'tiện nghi khách sạn hoặc loại phòng',
};

export const ApproveRequestModal = ({
  request,
  onClose,
  onSubmit,
}) => {
  if (!request) return null;

  const ApproveIcon = getAmenityLucideIcon(request.ten_de_xuat);
  const loaiDx = inferLoaiDeXuat(request);
  const targetTab = TARGET_TAB_HINT[loaiDx] || 'danh mục tiện nghi tương ứng';
  const partnerNote = getPartnerRequestNote(request.mo_ta);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Xác nhận duyệt tiện nghi</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: 14, color: '#5a7a72', marginBottom: 14, lineHeight: 1.5 }}>
          Bạn có chắc muốn duyệt yêu cầu này? Sau khi duyệt, bạn có thể thêm tiện nghi vào danh sách
          {' '}{targetTab}.
        </p>

        <div className="amenity-approve-preview">
          <div className="amenity-approve-icon">
            <ApproveIcon size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1a2e28' }}>{request.ten_de_xuat}</div>
            <div style={{ fontSize: 13, color: '#5a7a72', marginTop: 3 }}>
              Đề xuất bởi {request.doi_tac?.ten_cong_ty || 'đối tác'}
              {loaiDx && (
                <span style={{ marginLeft: 8 }} className={`badge ${LOAI_LABEL[loaiDx]?.cls}`}>
                  {LOAI_LABEL[loaiDx]?.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {partnerNote && (
          <div style={{
            marginBottom: 16,
            padding: '10px 12px',
            background: '#f8fdfb',
            borderRadius: 8,
            fontSize: 13,
            color: '#5a7a72',
            border: '1px solid #e8f5f1',
          }}
          >
            <strong style={{ color: '#1a2e28' }}>Ghi chú đối tác: </strong>
            {partnerNote}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>Xác nhận duyệt</button>
        </div>
      </div>
    </div>
  );
};
