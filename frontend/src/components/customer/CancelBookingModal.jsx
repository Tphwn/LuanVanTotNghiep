import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import customerBookingService from '../../services/customerBookingService';
import CustomerPrice from './CustomerPrice';
import CustomerLoadingState from './CustomerLoadingState';
import { formatCurrency } from '../../utils/bookingDisplay';

/**
 * @param {'booking'|'payment'} variant

 */
export default function CancelBookingModal({
  booking,
  variant = 'booking',
  onClose,
  onConfirmed,
  fetchPreview,
  submitCancel,
}) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPaymentCancel = variant === 'payment';

  useEffect(() => {
    if (!booking) return undefined;

    setLoading(true);
    setError('');
    const load = fetchPreview
      ? fetchPreview()
      : customerBookingService.getCancelPreview(booking.ma_dat_phong);

    load
      .then((res) => setPreview(res.data?.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Không tải được thông tin hủy');
      })
      .finally(() => setLoading(false));

    return undefined;
  }, [booking, fetchPreview]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = submitCancel
        ? await submitCancel()
        : await customerBookingService.cancelBooking(booking.ma_dat_phong);
      onConfirmed(res.data?.data, {
        successMessage: isPaymentCancel
          ? 'Hủy thanh toán thành công'
          : 'Đã hủy đơn đặt phòng thành công',
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message
          || (isPaymentCancel ? 'Không thể hủy thanh toán' : 'Không thể hủy đơn'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box cancel-booking-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="cancel-booking-title">
              {isPaymentCancel ? 'Xác nhận hủy thanh toán' : 'Xác nhận hủy đơn'}
            </h3>
            <p className="cancel-booking-modal-sub">
              Mã đơn:
              {' '}
              <strong>{booking.ma_don_hang || booking.ma_don}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        {loading && (
          <CustomerLoadingState
            compact
            className="cancel-booking-modal-loading"
            message={isPaymentCancel ? 'Đang tải thông tin...' : 'Đang tải chính sách hủy...'}
          />
        )}

        {!loading && preview && (
          <>
            {isPaymentCancel ? (
              <p className="cancel-booking-modal-intro">
                Bạn sắp hủy phiên thanh toán cho đơn tại
                {' '}
                <strong>{preview.ten_khach_san || 'khách sạn'}</strong>
                .
              </p>
            ) : (
              <p className="cancel-booking-modal-intro">
                Theo chính sách hủy của
                {' '}
                <strong>{preview.ten_khach_san || 'khách sạn'}</strong>
                ,
                {' '}
                còn
                {' '}
                <strong>{preview.so_ngay_con_lai}</strong>
                {' '}
                ngày trước ngày nhận phòng.
              </p>
            )}

            {!isPaymentCancel && preview.chinh_sach?.length > 0 && (
              <div className="cancel-booking-policy-box">
                <h4 className="cancel-booking-policy-title">Chính sách hủy</h4>
                <ul className="cancel-booking-policy-list">
                  {preview.chinh_sach.map((rule) => (
                    <li
                      key={`${rule.so_ngay_truoc}-${rule.phan_tram_hoan}`}
                      className={
                        preview.ap_dung?.so_ngay_truoc === rule.so_ngay_truoc
                          ? 'cancel-booking-policy-item cancel-booking-policy-item--active'
                          : 'cancel-booking-policy-item'
                      }
                    >
                      Hủy trước
                      {' '}
                      <strong>{rule.so_ngay_truoc}</strong>
                      {' '}
                      ngày: hoàn
                      {' '}
                      <strong>
                        {rule.phan_tram_hoan}
                        %
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="cancel-booking-summary">
              <div className="cancel-booking-summary-row">
                <span>{isPaymentCancel ? 'Số tiền cần thanh toán' : 'Tổng thanh toán'}</span>
                <CustomerPrice amount={preview.thanh_toan_cuoi} />
              </div>
              {!isPaymentCancel && preview.da_thanh_toan_online && (
                <>
                  <div className="cancel-booking-summary-row">
                    <span>Mức hoàn áp dụng</span>
                    <strong>
                      {preview.ap_dung?.phan_tram_hoan ?? 0}
                      %
                    </strong>
                  </div>
                  <div className="cancel-booking-summary-row cancel-booking-summary-row--highlight">
                    <span>Số tiền hoàn dự kiến</span>
                    <strong>{formatCurrency(preview.ap_dung?.so_tien_hoan)}</strong>
                  </div>
                </>
              )}
            </div>

            {!isPaymentCancel && preview.tom_tat && (
              <p className="cancel-booking-modal-note">{preview.tom_tat}</p>
            )}
            
          </>
        )}

        {error && (
          <p className="cancel-booking-modal-error">{error}</p>
        )}

        <div className="cancel-booking-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            {isPaymentCancel ? 'Không hủy' : 'Không hủy'}
          </button>
          <button
            type="button"
            className={`my-booking-cancel-btn cancel-booking-modal-confirm${submitting ? ' is-loading' : ''}`}
            onClick={handleConfirm}
            disabled={loading || submitting || !preview}
            aria-busy={submitting ? 'true' : undefined}
          >
            {submitting ? (
              <>
                <Loader2 className="customer-cta-spinner" size={16} strokeWidth={2.25} aria-hidden />
                <span>Đang hủy...</span>
              </>
            ) : (
              isPaymentCancel ? 'Xác nhận hủy thanh toán' : 'Xác nhận hủy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
