import { Check, X } from 'lucide-react';
import { LOAI_LABEL, REQUEST_STATUS } from '../constants';
import { inferLoaiDeXuat, formatTimeAgo } from '../utils';

export const RequestCard = ({ req, onApprove, onReject }) => {
  const isPending = req.trang_thai === 'cho_xu_ly';
  const loaiDx = inferLoaiDeXuat(req);
  const loaiInfo = loaiDx ? LOAI_LABEL[loaiDx] : { label: 'Chưa rõ', cls: 'badge-default' };
  const st = REQUEST_STATUS[req.trang_thai] || { label: req.trang_thai, cls: 'badge-default' };
  return (
    <div className="request-card">
      <div className="request-card-body">
        <div className="request-card-info">
          <div className="request-card-title">{req.ten_de_xuat}</div>
          <div className="request-card-tags">
            <span className={`badge ${loaiInfo.cls}`}>{loaiInfo.label}</span>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          <div className="request-card-meta">
            Đề xuất bởi <strong>{req.doi_tac?.ten_cong_ty || '—'}</strong>
            {req.doi_tac?.ten_khach_san && ` · ${req.doi_tac.ten_khach_san}`}
            {req.ngay_yeu_cau && ` · ${formatTimeAgo(req.ngay_yeu_cau)}`}
          </div>
          {req.mo_ta && (
            <div className="request-card-quote">"{req.mo_ta}"</div>
          )}
          {!isPending && req.phan_hoi && (
            <div className="request-card-feedback">
              Phản hồi: {req.phan_hoi}
            </div>
          )}
        </div>
        <div className="request-card-actions">
          <button
            type="button"
            className="btn-request-reject"
            disabled={!isPending}
            onClick={() => isPending && onReject(req.ma_yeu_cau)}
          >
            <X size={13} /> Từ chối
          </button>
          <button
            type="button"
            className="btn-request-approve"
            disabled={!isPending}
            onClick={() => isPending && onApprove(req)}
          >
            <Check size={13} /> Duyệt & thêm
          </button>
        </div>
      </div>
    </div>
  );
};
