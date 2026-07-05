import DetailTable from '../../../../components/booking/DetailTable';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date.toLocaleDateString('vi-VN')} - ${time}`;
};

const ScoreRow = ({ label, value, highlight = false }) => (
  <div className={`partner-review-detail-score-row${highlight ? ' partner-review-detail-score-row--overall' : ''}`}>
    <span>{label}</span>
    <strong>{value != null ? `${value}/5` : '—'}</strong>
  </div>
);

const ReviewDetailModal = ({ review, loading, onClose }) => {
  if (!review && !loading) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box partner-review-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="partner-review-detail-header">
          <h3 className="modal-title">Chi tiết đánh giá</h3>
          {review && (
            <span className={`badge ${review.da_phan_hoi ? 'badge-success' : 'badge-warning'}`}>
              {review.da_phan_hoi ? 'Đã phản hồi' : 'Chưa phản hồi'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="partner-review-detail-loading">Đang tải...</div>
        ) : (
          <>
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
                    { label: 'Loại phòng', value: review.ten_loai || '—' },
                    { label: 'Ngày nhận phòng', value: formatDate(review.ngay_nhan_phong) },
                    { label: 'Ngày trả phòng', value: formatDate(review.ngay_tra_phong) },
                  ]}
                />
              </div>

              <div className="partner-review-detail-right">
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

                {review.phan_hoi_doi_tac && (
                  <div className="partner-review-detail-section">
                    <h4 className="booking-detail-section-title">Phản hồi của bạn</h4>
                    <div className="review-partner-reply">{review.phan_hoi_doi_tac}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="partner-review-detail-footer">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewDetailModal;
