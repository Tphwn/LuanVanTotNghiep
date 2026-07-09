import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import customerBookingService from '../../services/customerBookingService';
import CustomerButton from '../../components/customer/CustomerButton';
import CancelBookingModal from '../../components/customer/CancelBookingModal';
import ROUTES from '../../constants/routes';
import {
  CUSTOMER_PAYMENT_STATUS,
  formatBookingDate,
  formatCurrency,
} from '../../utils/bookingDisplay';
import '../../assets/styles/home.css';

const PAYMENT_METHOD_LABEL = {
  online: 'Trực tuyến',
  tai_khach_san: 'Tại khách sạn',
};

const getStatusTone = (status) => {
  if (status === 'da_huy' || status === 'tu_choi') return 'cancel';
  if (status === 'hoan_thanh') return 'done';
  if (status === 'da_checkin') return 'checkin';
  return 'pending';
};

const InfoField = ({ label, value }) => (
  <div className="booking-detail-field">
    <span className="booking-detail-field-label">{label}</span>
    <span className="booking-detail-field-value">{value ?? '—'}</span>
  </div>
);

export default function CustomerBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    if (!id) return undefined;

    let isMounted = true;
    setLoading(true);
    setError('');

    customerBookingService.getBookingById(id)
      .then((res) => {
        if (isMounted) setBooking(res.data?.data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không tải được chi tiết đơn');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCancelConfirmed = () => {
    setCancelTarget(null);
    navigate(ROUTES.CUSTOMER.MY_BOOKINGS);
  };

  if (loading) {
    return (
      <div className="booking-detail-card booking-detail-card--state">
        Đang tải chi tiết đơn...
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-detail-card booking-detail-card--state">
        <p className="booking-detail-error">{error}</p>
        <CustomerButton to={ROUTES.CUSTOMER.MY_BOOKINGS}>Quay lại danh sách</CustomerButton>
      </div>
    );
  }

  if (!booking) return null;

  const { khach_san, loai_phong, luu_tru, nguoi_dat, thanh_toan } = booking;
  const statusTone = getStatusTone(booking.trang_thai);
  const thueVat = Math.max(
    0,
    Number(thanh_toan?.tong_tien || 0) - Number(thanh_toan?.tam_tinh || 0) + Number(thanh_toan?.giam_gia || 0),
  );

  return (
    <div className="booking-detail-page">
      <div className="booking-detail-card">
        <div className="booking-detail-toolbar">
          <button
            type="button"
            className="booking-detail-back"
            onClick={() => navigate(ROUTES.CUSTOMER.MY_BOOKINGS)}
          >
            ← Quay lại
          </button>
          <span className={`my-booking-status my-booking-status--${statusTone}`}>
            {booking.trang_thai_label}
          </span>
        </div>

        <section className="booking-detail-block">
          <h2 className="booking-detail-block-title">Thông tin khách hàng</h2>
          <div className="booking-detail-split">
            <div className="booking-detail-split-col">
              <InfoField label="Họ tên" value={nguoi_dat?.ho_ten} />
              <InfoField label="Mã đơn" value={booking.ma_don} />
              <InfoField label="Đặt ngày" value={formatBookingDate(booking.ngay_dat)} />
              <InfoField label="Ghi chú" value={nguoi_dat?.ghi_chu || 'Không có'} />
            </div>
            <div className="booking-detail-split-col">
              <InfoField label="Số điện thoại" value={nguoi_dat?.so_dien_thoai} />
              <InfoField label="Email" value={nguoi_dat?.email} />
            </div>
          </div>
        </section>

        <section className="booking-detail-block">
          <h2 className="booking-detail-block-title">Thông tin đơn đặt</h2>
          <InfoField label="Khách sạn" value={khach_san?.ten} />
          <InfoField label="Loại phòng" value={loai_phong?.ten_loai} />
          <InfoField label="Địa chỉ" value={khach_san?.dia_chi} />
          <div className="booking-detail-split booking-detail-split--room">
            <div className="booking-detail-split-col">
              <InfoField label="Số giường" value={loai_phong?.loai_giuong} />
              <InfoField
                label="Diện tích"
                value={loai_phong?.dien_tich != null ? `${loai_phong.dien_tich}m2` : '—'}
              />
              <InfoField label="Ngày nhận phòng" value={formatBookingDate(luu_tru?.ngay_nhan)} />
              <InfoField label="Người lớn" value={luu_tru?.so_nguoi_lon ?? 0} />
            </div>
            <div className="booking-detail-split-col">
              <InfoField
                label="Sức chứa"
                value={loai_phong?.suc_chua ? `${loai_phong.suc_chua} Khách` : '—'}
              />
              <InfoField label="Số phòng" value={luu_tru?.so_phong ?? 1} />
              <InfoField label="Ngày trả phòng" value={formatBookingDate(luu_tru?.ngay_tra)} />
              <InfoField label="Trẻ em" value={luu_tru?.so_tre_em ?? 0} />
            </div>
          </div>
        </section>

      

        <section className="booking-detail-block booking-detail-block--payment">
          <h2 className="booking-detail-block-title">Chi tiết thanh toán</h2>
          <div className="booking-detail-split">
            <div className="booking-detail-split-col">
              <InfoField
                label="Giá mỗi đêm"
                value={thanh_toan?.gia_moi_dem != null ? formatCurrency(thanh_toan.gia_moi_dem) : '—'}
              />
              <InfoField
                label="Giảm giá"
                value={thanh_toan?.giam_gia != null ? formatCurrency(thanh_toan.giam_gia) : '—'}
              />
              <InfoField
                label="Trạng thái thanh toán"
                value={CUSTOMER_PAYMENT_STATUS[thanh_toan?.trang_thai] || thanh_toan?.trang_thai}
              />
            </div>
            <div className="booking-detail-split-col">
              <InfoField label="Số đêm ở" value={luu_tru?.so_dem ?? 0} />
              <InfoField label="Thuế & VAT" value={formatCurrency(thueVat)} />
              <InfoField
                label="Phương thức thanh toán"
                value={PAYMENT_METHOD_LABEL[thanh_toan?.phuong_thuc] || thanh_toan?.phuong_thuc}
              />
            </div>
          </div>
          {(booking.trang_thai === 'da_huy' || booking.trang_thai === 'tu_choi') && (
          <section className="booking-detail-block booking-detail-block--cancel">
            <h2 className="booking-detail-block-title">
              {booking.huy_boi_admin ? 'Đơn bị admin hủy' : 'Thông tin hủy đơn'}
            </h2>
            {booking.ly_do_huy && (
              <InfoField
                label={booking.huy_boi_admin ? 'Lý do admin hủy' : 'Lý do hủy'}
                value={booking.ly_do_huy}
              />
            )}
            {booking.tom_tat_hoan_tien && (
              <div className="booking-detail-cancel-note">
                <span className="booking-detail-cancel-note-label">Hoàn tiền</span>
                <p>{booking.tom_tat_hoan_tien}</p>
              </div>
            )}
            {booking.hoan_tien?.so_tien_hoan > 0 && (
              <InfoField
                label="Số tiền hoàn"
                value={
                  booking.huy_boi_admin
                    ? `100% — ${formatCurrency(booking.hoan_tien.so_tien_hoan)}`
                    : formatCurrency(booking.hoan_tien.so_tien_hoan)
                }
              />
            )}
            {booking.hoan_tien?.trang_thai_label && (
              <InfoField
                label="Trạng thái hoàn tiền"
                value={booking.hoan_tien.trang_thai_label}
              />
            )}
          </section>
        )}
          <div className="booking-detail-total-row">
            <span className="booking-detail-total-label">Tổng thanh toán</span>
            <strong className="booking-detail-total-amount">
              {thanh_toan?.tong_tien != null ? formatCurrency(thanh_toan.tong_tien) : '—'}
            </strong>
          </div>
        </section>

        {booking.co_the_huy && (
          <div className="booking-detail-actions">
            <button
              type="button"
              className="my-booking-cancel-btn"
              onClick={() => setCancelTarget(booking)}
            >
              Hủy đơn
            </button>
          </div>
        )}

        {booking.co_the_danh_gia && (
          <div className="booking-detail-actions">
            <CustomerButton
              to={ROUTES.CUSTOMER.MY_BOOKING_REVIEW.replace(':id', booking.ma_dat_phong)}
            >
              Đánh giá khách sạn
            </CustomerButton>
          </div>
        )}

        {booking.da_danh_gia && (
          <div className="booking-detail-actions">
            <CustomerButton
              to={ROUTES.CUSTOMER.MY_BOOKING_REVIEW_VIEW.replace(':id', booking.ma_dat_phong)}
            >
              Xem lại đánh giá
            </CustomerButton>
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelBookingModal
          booking={{
            ma_dat_phong: booking.ma_dat_phong,
            ma_don_hang: booking.ma_don,
            thanh_toan_cuoi: thanh_toan?.tong_tien,
          }}
          onClose={() => setCancelTarget(null)}
          onConfirmed={handleCancelConfirmed}
        />
      )}
    </div>
  );
}
