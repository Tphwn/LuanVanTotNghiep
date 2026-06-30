import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';
import { LOAI_LABEL } from '../constants';
import { inferLoaiDeXuat } from '../utils';

const TARGET_TAB_HINT = {
  khach_san: 'Tiện nghi khách sạn',
  phong: 'Tiện nghi loại phòng',
  ca_hai: 'Tiện nghi khách sạn hoặc loại phòng',
};

export const ApproveRequestModal = ({
  request,
  onClose,
  onSubmit,
}) => {
  if (!request) return null;

  const ApproveIcon = getAmenityLucideIcon(request.ten_de_xuat);
  const loaiDx = inferLoaiDeXuat(request);
  const targetTab = TARGET_TAB_HINT[loaiDx] || 'tab tiện nghi tương ứng';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Duyệt yêu cầu tiện nghi</h3>
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

        {request.mo_ta && (
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
            {request.mo_ta}
          </div>
        )}

        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          background: '#fff8e6',
          borderRadius: 8,
          border: '1px solid #fac775',
          fontSize: 13,
          color: '#7a5a00',
          lineHeight: 1.5,
        }}
        >
          Xác nhận duyệt sẽ thông báo cho đối tác. Bạn cần tự thêm tiện nghi vào tab
          {' '}
          <strong>{targetTab}</strong>
          {' '}
          (có thể tách nhiều tiện nghi nếu đối tác gửi cùng lúc).
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>Xác nhận duyệt</button>
        </div>
      </div>
    </div>
  );
};
