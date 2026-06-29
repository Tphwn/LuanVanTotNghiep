import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import api from '../../../services/api';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import DetailTable from '../../../components/booking/DetailTable';
import ActionButton from '../../../components/common/ActionButton';

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

const ScoreItem = ({ label, value }) => (
  <div className="review-score-item">
    <span className="review-score-label">{label}</span>
    <span className="review-score-value">{value != null ? `${value}/5` : '—'}</span>
  </div>
);

const RespondModal = ({ review, onClose, onSave, saving }) => {
  const [text, setText] = useState(review?.phan_hoi_doi_tac || '');

  if (!review) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{review.da_phan_hoi ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
          Nội dung phản hồi
        </label>
        <textarea
          className="search-input"
          rows={4}
          style={{ width: '100%', resize: 'vertical', marginBottom: 16 }}
          placeholder="Cảm ơn quý khách đã lưu trú..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || !text.trim()}
            onClick={() => onSave(text.trim())}
          >
            {saving ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReviewDetailPage() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [respondOpen, setRespondOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadReview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/partner/reviews/${id}`);
      setReview(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải chi tiết đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadReview();
  }, [id]);

  const handleRespond = async (text) => {
    setSaving(true);
    try {
      const res = await api.put(`/partner/reviews/${id}/respond`, { phan_hoi_doi_tac: text });
      setReview(res.data.data);
      setRespondOpen(false);
      showToast('Đã gửi phản hồi thành công');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gửi phản hồi thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mgmt-page">
        <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải...</div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="mgmt-page booking-detail-page">
        <BackButton to="/partner/reviews" />
        <div className="booking-detail-error-box" style={{ marginTop: 16 }}>
          <h4 className="booking-detail-section-title">{error || 'Không tìm thấy đánh giá'}</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page booking-detail-page">
      <div className="booking-detail-top">
        <BackButton to="/partner/reviews" />
        <ActionButton
          variant="reply"
          icon={MessageSquare}
          onClick={() => setRespondOpen(true)}
        >
          {review.da_phan_hoi ? 'Sửa phản hồi' : 'Phản hồi'}
        </ActionButton>
      </div>

      <ManagementHeader
        title="Chi tiết đánh giá"
        subtitle={`#${review.ma_danh_gia} · ${review.ten_khach_san}`}
      />

      {toast && (
        <div className={`mgmt-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          {toast.msg}
        </div>
      )}

      <div className="booking-detail-grid">
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

      <div className="booking-detail-section">
        <h4 className="booking-detail-section-title">Điểm đánh giá chi tiết</h4>
        <div className="review-score-grid">
          <ScoreItem label="Tổng thể" value={review.so_sao} />
          <ScoreItem label="Sạch sẽ" value={review.diem_sach_se} />
          <ScoreItem label="Dịch vụ" value={review.diem_dich_vu} />
          <ScoreItem label="Vị trí" value={review.diem_vi_tri} />
          <ScoreItem label="Tiện nghi" value={review.diem_tien_nghi} />
        </div>
      </div>

      <div className="booking-detail-section">
        <h4 className="booking-detail-section-title">Nội dung đánh giá</h4>
        <p className="review-content-text">
          {review.noi_dung?.trim() ? review.noi_dung : 'Khách hàng không để lại nhận xét.'}
        </p>
      </div>

      <div className="booking-detail-section">
        <h4 className="booking-detail-section-title">Trạng thái phản hồi</h4>
        <span className={`badge ${review.da_phan_hoi ? 'badge-success' : 'badge-warning'}`}>
          {review.da_phan_hoi ? 'Đã phản hồi' : 'Chưa phản hồi'}
        </span>
      </div>

      {review.phan_hoi_doi_tac && (
        <div className="booking-detail-section">
          <h4 className="booking-detail-section-title">Phản hồi của đối tác</h4>
          <p className="review-partner-reply">{review.phan_hoi_doi_tac}</p>
          <p className="review-partner-reply-date">Ngày phản hồi: {formatDateTime(review.ngay_phan_hoi)}</p>
        </div>
      )}

      {respondOpen && (
        <RespondModal
          review={review}
          onClose={() => setRespondOpen(false)}
          onSave={handleRespond}
          saving={saving}
        />
      )}
    </div>
  );
}
