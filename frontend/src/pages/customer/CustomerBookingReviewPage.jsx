import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Star } from 'lucide-react';
import customerBookingService from '../../services/customerBookingService';
import CustomerButton from '../../components/customer/CustomerButton';
import CustomerStarRating from '../../components/customer/CustomerStarRating';
import ReviewModerationNotice from '../../components/review/ReviewModerationNotice';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { formatBookingDate } from '../../utils/bookingDisplay';
import { resolveUploadUrl } from '../../utils/media';
import '../../assets/styles/home.css';

const REVIEW_CRITERIA = [
  {
    key: 'so_sao',
    label: 'Điểm tổng thể',
    hint: 'Bạn hài lòng với kỳ lưu trú này như thế nào',
    required: true,
  },
  {
    key: 'diem_sach_se',
    label: 'Sạch sẽ',
    hint: 'Phòng và không gian sạch sẽ, gọn gàng',
    required: true,
  },
  {
    key: 'diem_dich_vu',
    label: 'Dịch vụ',
    hint: 'Thái độ phục vụ và hỗ trợ của nhân viên',
    required: true,
  },
  {
    key: 'diem_vi_tri',
    label: 'Vị trí',
    hint: 'Vị trí thuận tiện, dễ đi lại',
    required: false,
  },
  {
    key: 'diem_tien_nghi',
    label: 'Tiện nghi',
    hint: 'Trang thiết bị và tiện nghi đáp ứng với nhu cầu',
    required: false,
  },
];

const EMPTY_SCORES = {
  so_sao: 0,
  diem_sach_se: 0,
  diem_dich_vu: 0,
  diem_vi_tri: 0,
  diem_tien_nghi: 0,
};

export default function CustomerBookingReviewPage({ viewMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [scores, setScores] = useState(EMPTY_SCORES);
  const [noiDung, setNoiDung] = useState('');
  const isViewMode = viewMode;

  useEffect(() => {
    if (!id || !token) return undefined;

    let isMounted = true;
    setLoading(true);
    setError('');

    const load = async () => {
      try {
        const bookingRes = await customerBookingService.getBookingById(id);
        if (!isMounted) return;

        const data = bookingRes.data?.data;
        setBooking(data);

        if (isViewMode || data?.da_danh_gia) {
          if (!data?.da_danh_gia) {
            setError('Đơn này chưa có đánh giá.');
            return;
          }
          const reviewRes = await customerBookingService.getReviewByBookingId(id);
          if (!isMounted) return;
          const reviewData = reviewRes.data?.data;
          setReview(reviewData);
          setScores({
            so_sao: reviewData.so_sao || 0,
            diem_sach_se: reviewData.diem_sach_se || 0,
            diem_dich_vu: reviewData.diem_dich_vu || 0,
            diem_vi_tri: reviewData.diem_vi_tri || 0,
            diem_tien_nghi: reviewData.diem_tien_nghi || 0,
          });
          setNoiDung(reviewData.noi_dung || '');
        } else if (!data?.co_the_danh_gia) {
          setError('Đơn này không thể đánh giá.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không tải được thông tin đơn');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id, token, isViewMode]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const missing = REVIEW_CRITERIA.find(
      (item) => item.required && (!scores[item.key] || scores[item.key] < 1),
    );
    if (missing) {
      setError(`Vui lòng chọn điểm cho mục "${missing.label}"`);
      return;
    }

    if (!noiDung.trim()) {
      setError('Vui lòng nhập nhận xét của bạn về khách sạn');
      return;
    }

    setSubmitting(true);
    try {
      await customerBookingService.createReview(id, {
        ...scores,
        noi_dung: noiDung.trim(),
      });
      showToast('Đánh giá thành công!');
      setTimeout(() => navigate(ROUTES.CUSTOMER.MY_BOOKINGS), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.vai_tro && user.vai_tro !== ROLES.KHACH_HANG) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (loading) {
    return (
      <div className="customer-review-page">
        <div className="customer-review-card customer-review-card--state">Đang tải...</div>
      </div>
    );
  }

  const showReadOnly = isViewMode || booking?.da_danh_gia;

  if (!booking || (error && !showReadOnly && !booking.co_the_danh_gia)) {
    return (
      <div className="customer-review-page">
        <div className="customer-review-card customer-review-card--state">
          <p className="customer-review-error">{error || 'Không tìm thấy đơn'}</p>
          <CustomerButton to={ROUTES.CUSTOMER.MY_BOOKINGS}>Quay lại đặt chỗ</CustomerButton>
        </div>
      </div>
    );
  }

  const { khach_san, loai_phong, luu_tru } = booking;
  const hotelImage = resolveUploadUrl(khach_san?.anh_dai_dien);
  const stayRange = `${formatBookingDate(luu_tru?.ngay_nhan)} → ${formatBookingDate(luu_tru?.ngay_tra)}`;

  const criteriaList = (
    <div className="customer-review-criteria-list">
      {REVIEW_CRITERIA.map((item) => (
        <CustomerStarRating
          key={item.key}
          label={item.label}
          hint={item.hint}
          required={item.required}
          value={scores[item.key]}
          readOnly={showReadOnly}
          onChange={(val) => {
            setScores((prev) => ({ ...prev, [item.key]: val }));
            if (error) setError('');
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="customer-review-page">
      {toast && (
        <div className={`mgmt-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <button
        type="button"
        className="booking-detail-back"
        onClick={() => navigate(ROUTES.CUSTOMER.MY_BOOKINGS)}
      >
        ← Quay lại
      </button>

      <header className="customer-review-header">
        <h1>{showReadOnly ? 'Đánh giá của bạn' : 'Đánh giá khách sạn'}</h1>
        <p>
          {showReadOnly
            ? 'Xem lại nội dung đánh giá bạn đã gửi cho khách sạn'
            : 'Chia sẻ trải nghiệm của bạn để chúng tôi cải thiện dịch vụ tốt hơn'}
        </p>
      </header>

      <div className="customer-review-layout">
        <aside className="customer-review-summary-card">
          <div className="customer-review-summary-media">
            {hotelImage ? (
              <img src={hotelImage} alt={khach_san?.ten || 'Khách sạn'} />
            ) : (
              <div className="customer-review-summary-media-fallback" aria-hidden>
                {(khach_san?.ten || 'KS').slice(0, 1)}
              </div>
            )}
          </div>

          <div className="customer-review-summary-body">
            <h2 className="customer-review-summary-hotel">{khach_san?.ten || '—'}</h2>
            <p className="customer-review-summary-room">{loai_phong?.ten_loai || '—'}</p>
            <p className="customer-review-summary-dates">{stayRange}</p>
            <p className="customer-review-summary-meta">
              Mã đơn #{booking.ma_don || booking.ma_dat_phong}
            </p>
            {khach_san?.dia_chi && (
              <p className="customer-review-summary-meta">{khach_san.dia_chi}</p>
            )}
          </div>

          {showReadOnly && scores.so_sao > 0 && (
            <div className="customer-review-summary-score">
              <span>Điểm TB</span>
              <strong>
                <Star size={14} fill="currentColor" strokeWidth={2} />
                {Number(scores.so_sao).toFixed(1)}
              </strong>
            </div>
          )}
        </aside>

        {showReadOnly ? (
          <section className="customer-review-form-block">
            {criteriaList}

            <div className="customer-review-comment-card">
              <span>Nhận xét của bạn về khách sạn</span>
              <p className="customer-review-readonly-text">
                {noiDung?.trim() || 'Không có nhận xét'}
              </p>
            </div>

            {review?.trang_thai === 'an' && (
              <ReviewModerationNotice
                variant="hidden"
                title="Đánh giá đã bị ẩn bởi admin"
                reasonLabel="Lý do"
                reason={review.ly_do_an || '—'}
              />
            )}

            {review?.phan_hoi_doi_tac && (
              <div className="customer-review-partner-reply">
                <span>Phản hồi từ khách sạn</span>
                <p>{review.phan_hoi_doi_tac}</p>
              </div>
            )}

            {review?.ngay_danh_gia && (
              <p className="customer-review-submitted-at">
                Gửi ngày {formatBookingDate(review.ngay_danh_gia)}
              </p>
            )}
          </section>
        ) : (
          <form className="customer-review-form-block" onSubmit={handleSubmit} noValidate>
            {criteriaList}

            <div className="customer-review-comment-card">
              <label className="customer-review-field" htmlFor="review-content">
                <span className="required">Nhận xét của bạn về khách sạn</span>
                <textarea
                  id="review-content"
                  className={`customer-review-textarea${error ? ' input-invalid' : ''}`}
                  value={noiDung}
                  onChange={(e) => {
                    setNoiDung(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Chia sẻ chi tiết trải nghiệm của bạn..."
                  maxLength={2000}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'review-content-error' : undefined}
                />
              </label>
              {error && (
                <p id="review-content-error" className="form-field-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="customer-review-form-footer">
              <CustomerButton
                type="submit"
                className="customer-review-submit"
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </CustomerButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
