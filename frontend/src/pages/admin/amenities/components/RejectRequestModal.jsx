import ReasonField from '../../../../components/common/ReasonField';
import { LOAI_LABEL } from '../constants';
import { inferLoaiDeXuat } from '../utils';

export const RejectRequestModal = ({
  request,
  rejectReason,
  onClose,
  onSubmit,
  onReasonChange,
}) => {
  if (!request) return null;

  const loaiDx = inferLoaiDeXuat(request);
  const loaiMeta = LOAI_LABEL[loaiDx];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Xác nhận từ chối tiện nghi</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: 14, color: '#5a7a72', marginBottom: 12, lineHeight: 1.5 }}>
          Bạn có chắc muốn từ chối yêu cầu tiện nghi
          {' '}
          <strong style={{ color: '#1a2e28' }}>&quot;{request.ten_de_xuat}&quot;</strong>
          {loaiMeta ? ` (${loaiMeta.label})` : ''}
          {' '}của {request.doi_tac?.ten_cong_ty || 'đối tác'}?
          Đối tác sẽ nhận được thông báo kèm lý do từ chối.
        </p>

        <ReasonField
          id="amenity-reject-reason"
          label="Lý do từ chối"
          required
          value={rejectReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="VD: Tiện nghi này đã tồn tại với tên khác..."
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-danger" onClick={onSubmit}>Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  );
};
