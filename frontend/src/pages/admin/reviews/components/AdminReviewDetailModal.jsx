import { EyeOff, Eye, MessageSquareOff, MessageSquare } from 'lucide-react';
import DetailTable from '../../../../components/booking/DetailTable';
import ActionButton from '../../../../components/common/ActionButton';
import ReviewModerationNotice from '../../../../components/review/ReviewModerationNotice';
import { REVIEW_BADGE } from '../../../../constants/statusConfig';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');

const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${time}`;
};

const ScoreRow = ({ label, value, highlight = false }) => (
  <div className={`partner-review-detail-score-row${highlight ? ' partner-review-detail-score-row--overall' : ''}`}>
    <span>{label}</span>
    <strong>{value != null ? `${value}/5` : '—'}</strong>
  </div>
);

const AdminReviewDetailModal = ({
  review,
  onClose,
  onRequestAction,
  actionLoading,
}) => {
  if (!review) return null;

  const st = REVIEW_BADGE[review.trang_thai] || { label: review.trang_thai, cls: 'badge-default' };
  const isHidden = review.trang_thai === 'an';
  const hasPartnerReply = Boolean(review.phan_hoi_doi_tac?.trim());
  const isResponseHidden = Boolean(review.phan_hoi_bi_an);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box partner-review-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="partner-review-detail-header">
          <h3 className="modal-title">Chi tiết đánh giá</h3>
          <span className={`badge ${st.cls}`}>{st.label}</span>
        </div>

        <div className="partner-review-detail-body">
          <div className="partner-review-detail-left">
            <DetailTable
              title="Thông tin khách"
              rows={[
                { label: 'Tên khách hàng', value: review.khach_hang?.ho_ten || '—' },
                { label: 'Số sao', value: `${review.so_sao}/5` },
                { label: 'Ngày đánh giá', value: formatDateTime(review.ngay_danh_gia) },
              ]}
            />
            <DetailTable
              title="Thông tin đặt phòng"
              rows={[
                { label: 'Mã đơn đặt phòng', value: review.ma_don_hang || '—' },
                { label: 'Tên khách sạn', value: review.ten_khach_san || '—' },
                { label: 'Đối tác', value: review.ten_doi_tac || '—' },
                { label: 'Loại phòng', value: review.ten_loai || '—' },
                { label: 'Ngày nhận phòng', value: formatDate(review.ngay_nhan_phong) },
                { label: 'Ngày trả phòng', value: formatDate(review.ngay_tra_phong) },
              ]}
            />
          </div>

          <div className="partner-review-detail-right">
            {isHidden && (
              <ReviewModerationNotice
                variant="hidden"
                title="Đánh giá đang bị ẩn"
                reasonLabel="Lý do ẩn"
                reason={review.ly_do_an || '—'}
              />
            )}

            <div className="partner-review-detail-section">
              <h4 className="booking-detail-section-title">Điểm đánh giá chi tiết</h4>
              <div className="partner-review-detail-scores">
                <ScoreRow label="Điểm tổng thể" value={review.so_sao} highlight />
                <ScoreRow label="Sạch sẽ" value={review.diem_sach_se} />
                <ScoreRow label="Dịch vụ" value={review.diem_dich_vu} />
                <ScoreRow label="Vị trí" value={review.diem_vi_tri} />
              </div>
            </div>

            <div className="partner-review-detail-section">
              <h4 className="booking-detail-section-title">Nội dung đánh giá</h4>
              <div className="partner-review-detail-content-box">
                {review.noi_dung?.trim()
                  ? review.noi_dung
                  : 'Khách hàng không để lại nhận xét.'}
              </div>
            </div>

            <div className="partner-review-detail-section">
              <h4 className="booking-detail-section-title">Phản hồi của đối tác</h4>
              {isResponseHidden && (
                <ReviewModerationNotice
                  variant="hidden"
                  title="Phản hồi đang bị ẩn"
                  reasonLabel="Lý do ẩn"
                  reason={review.ly_do_an_phan_hoi || '—'}
                />
              )}
              {hasPartnerReply ? (
                <div className={`review-partner-reply${isResponseHidden ? ' review-partner-reply--muted' : ''}`}>
                  {review.phan_hoi_doi_tac}
                </div>
              ) : (
                <div className="partner-review-detail-content-box partner-review-detail-content-box--empty">
                  Đối tác chưa phản hồi
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="partner-review-detail-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
          {hasPartnerReply && (
            <ActionButton
              variant={isResponseHidden ? 'unlock' : 'lock'}
              icon={isResponseHidden ? MessageSquare : MessageSquareOff}
              disabled={actionLoading}
              onClick={() => onRequestAction(review, isResponseHidden ? 'show-response' : 'hide-response')}
            >
              {actionLoading
                ? 'Đang xử lý...'
                : isResponseHidden
                  ? 'Mở phản hồi'
                  : 'Ẩn phản hồi'}
            </ActionButton>
          )}
          <ActionButton
            variant={isHidden ? 'unlock' : 'lock'}
            icon={isHidden ? Eye : EyeOff}
            disabled={actionLoading}
            onClick={() => onRequestAction(review, isHidden ? 'show-review' : 'hide-review')}
          >
            {actionLoading ? 'Đang xử lý...' : isHidden ? 'Mở đánh giá' : 'Ẩn đánh giá'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewDetailModal;
