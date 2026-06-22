import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchAdminBookingDetail,
  cancelAdminBooking,
  fetchBookingStats,
  fetchAdminBookings,
  clearDetail,
  clearMsg,
} from '../../../store/slices/adminBookingSlice';

import DetailTable from '../../../components/booking/DetailTable';
import ManagementHeader from '../../../components/common/management/ManagementHeader';

import {
  TRANG_THAI,
  PHUONG_THUC,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../../utils/bookingDisplay';

const CANCEL_BLOCKED_STATUS = ['hoan_thanh', 'da_huy', 'tu_choi'];

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    detail,
    detailLoading,
    loading,
    error,
    successMsg,
  } = useSelector((state) => state.adminBooking || {});

  const [cancelMode, setCancelMode] = useState(false);
  const [lyDo, setLyDo] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchAdminBookingDetail(id));
    }

    return () => {
      dispatch(clearDetail());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!successMsg && !error) return undefined;

    const timer = setTimeout(() => {
      dispatch(clearMsg());
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMsg, error, dispatch]);

  const bookingStatus = useMemo(() => {
    if (!detail) return { label: '—', cls: 'badge-default' };

    return TRANG_THAI[detail.trang_thai] || {
      label: detail.trang_thai,
      cls: 'badge-default',
    };
  }, [detail]);

  const paymentInfo = useMemo(() => {
    const isPaid = detail?.thanh_toan?.trang_thai === 'thanh_cong';

    return {
      label: isPaid ? 'Đã thanh toán' : 'Chờ thanh toán',
      badge: isPaid ? 'badge-success' : 'badge-warning',
    };
  }, [detail]);

  const canCancel = detail && !CANCEL_BLOCKED_STATUS.includes(detail.trang_thai);

  const hotelRows = useMemo(() => {
    if (!detail) return [];

    return [
      {
        label: 'Khách sạn',
        value: detail.loai_phong?.khach_san?.ten || '—',
      },
      {
        label: 'Đối tác',
        value: detail.loai_phong?.khach_san?.doi_tac?.ten_cong_ty || '—',
      },
      {
        label: 'Loại phòng',
        value: detail.loai_phong?.ten_loai || '—',
      },
      {
        label: 'Địa chỉ',
        value: detail.loai_phong?.khach_san?.dia_chi || '—',
      },
      {
        label: 'Nhận phòng',
        value: formatDate(detail.ngay_nhan_phong),
      },
      {
        label: 'Trả phòng',
        value: formatDate(detail.ngay_tra_phong),
      },
    ];
  }, [detail]);

  const guestRows = useMemo(() => {
    if (!detail) return [];

    return [
      {
        label: 'Khách hàng',
        value: detail.khach_hang?.ho_ten || '—',
      },
      {
        label: 'Email',
        value: detail.khach_hang?.nguoi_dung?.email || '—',
      },
      {
        label: 'SĐT',
        value: detail.khach_hang?.nguoi_dung?.so_dien_thoai || '—',
      },
      {
        label: 'Người nhận phòng',
        value: detail.ten_nguoi_nhan || '—',
      },
      {
        label: 'SĐT người nhận',
        value: detail.sdt_nguoi_nhan || '—',
      },
      {
        label: 'Ghi chú',
        value: detail.ghi_chu || '—',
      },
    ];
  }, [detail]);

  const handleBack = () => {
    navigate('/admin/bookings');
  };

  const closeCancelBox = () => {
    setCancelMode(false);
    setLyDo('');
  };

  const handleCancelBooking = async () => {
    if (!detail) return;

    if (!lyDo.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }

    const result = await dispatch(
      cancelAdminBooking({
        id: detail.ma_dat_phong,
        ly_do: lyDo.trim(),
      }),
    );

    if (cancelAdminBooking.fulfilled.match(result)) {
      dispatch(fetchBookingStats());
      dispatch(fetchAdminBookings());
      navigate('/admin/bookings');
    }
  };

  if (detailLoading) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 60 }}>
        Đang tải chi tiết đơn đặt phòng...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>
          Không tìm thấy đơn đặt phòng
        </p>

        <button type="button" className="btn btn-outline" onClick={handleBack}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="booking-detail-page">
      <ManagementHeader
        title="Quản lý đặt phòng"
        subtitle={`Chi tiết đơn ${detail.ma_don_hang}`}
      />

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 12 }}
        onClick={handleBack}
      >
        ← Quay lại
      </button>

      {(successMsg || error) && (
        <div
          className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}
          style={{ marginBottom: 16 }}
        >
          {successMsg || error}
        </div>
      )}

      <div className="content-card booking-detail-page-card">
        <div className="booking-detail-page-header">
          <div>
            <h2 className="booking-detail-page-title">
              Chi tiết đơn đặt phòng
            </h2>
            <p className="booking-detail-code">
              {detail.ma_don_hang}
            </p>
          </div>
        </div>

        <div className="booking-detail-status-bar booking-detail-status-bar--page">
          <div className="booking-detail-status-left">
            <span className={`badge ${bookingStatus.cls}`}>
              {bookingStatus.label}
            </span>

            <span className="booking-detail-meta">
              Đặt lúc {formatDateTime(detail.ngay_dat)}
            </span>
          </div>

          {canCancel && !cancelMode && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setCancelMode(true)}
            >
              Hủy đơn
            </button>
          )}
        </div>

        {cancelMode && (
          <div className="booking-reject-box">
            <p className="booking-reject-warning">
              Hủy đơn sẽ cập nhật trạng thái đơn và thông báo cho khách hàng.
              Vui lòng nhập lý do rõ ràng.
            </p>

            <label className="booking-reject-label">
              Lý do hủy <span style={{ color: '#e05c5c' }}>*</span>
            </label>

            <textarea
              rows={3}
              className="booking-reject-textarea"
              placeholder="VD: Khách sạn không đủ điều kiện phục vụ..."
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
            />

            <div className="booking-reject-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeCancelBox}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={handleCancelBooking}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        )}

        <div className="booking-detail-grid">
          <DetailTable title="Thông tin khách sạn" rows={hotelRows} />
          <DetailTable title="Thông tin khách" rows={guestRows} />
        </div>

        <div className="booking-detail-section">
          <h4 className="booking-detail-section-title">
            Thanh toán
          </h4>

          <div className="booking-detail-payment">
            <div className="booking-detail-payment-item">
              <span className="booking-detail-payment-label">
                Tổng tiền
              </span>

              <span className="booking-detail-payment-value booking-detail-payment-value--total">
                {formatCurrency(detail.thanh_toan_cuoi)}
              </span>

              {Number(detail.tien_giam) > 0 && (
                <span className="booking-detail-discount">
                  Giảm {formatCurrency(detail.tien_giam)}
                  {detail.khuyen_mai ? ` (${detail.khuyen_mai.ma_code})` : ''}
                </span>
              )}
            </div>

            <div className="booking-detail-payment-item">
              <span className="booking-detail-payment-label">
                Trạng thái
              </span>

              <span className="booking-detail-payment-value">
                <span className={`badge ${paymentInfo.badge}`}>
                  {paymentInfo.label}
                </span>
              </span>
            </div>

            <div className="booking-detail-payment-item">
              <span className="booking-detail-payment-label">
                Phương thức
              </span>

              <span className="booking-detail-payment-value">
                {PHUONG_THUC[detail.phuong_thuc_tt] || detail.phuong_thuc_tt || '—'}
              </span>
            </div>
          </div>
        </div>

        {detail.chi_tiet_dat_phong?.length > 0 && (
          <div className="booking-detail-section">
            <h4 className="booking-detail-section-title">
              Chi tiết giá từng đêm
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 360 }}>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Giá/đêm</th>
                    <th>Loại giá</th>
                  </tr>
                </thead>

                <tbody>
                  {detail.chi_tiet_dat_phong.map((item) => (
                    <tr key={item.ma_chi_tiet}>
                      <td>{formatDate(item.ngay)}</td>  

                      <td style={{ fontWeight: 500 }}>
                        {formatCurrency(item.don_gia)}
                      </td>

                      <td>
                        <span className={`badge ${getPriceTypeBadge(item.loai_gia)}`}>
                          {getPriceTypeLabel(item.loai_gia)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="booking-detail-footer">
          <button type="button" className="btn btn-ghost" onClick={handleBack}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function getPriceTypeLabel(type) {
  const labels = {
    co_ban: 'Cơ bản',
    cuoi_tuan: 'Cuối tuần',
    le_tet: 'Lễ tết',
    cao_diem: 'Cao điểm',
  };

  return labels[type] || 'Khác';
}

function getPriceTypeBadge(type) {
  const badges = {
    co_ban: 'badge-default',
    cuoi_tuan: 'badge-warning',
    le_tet: 'badge-danger',
    cao_diem: 'badge-info',
  };

  return badges[type] || 'badge-default';
}