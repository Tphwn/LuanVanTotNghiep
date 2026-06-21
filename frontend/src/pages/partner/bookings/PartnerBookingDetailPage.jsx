import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ActionButton, { TableActions } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import DetailTable from '../../../components/booking/DetailTable';
import {
  fetchBookingDetail,
  confirmBooking,
  rejectBooking,
  fetchPartnerBookings,
  clearDetail,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import {
  TRANG_THAI,
  PHUONG_THUC,
  formatCurrency,
  formatDate,
  formatDateTime,
  diffDays,
} from '../../../utils/bookingDisplay';

export default function PartnerBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { detail, detailLoading, loading, error, successMsg } = useSelector(
    (s) => s.partnerBooking || {},
  );

  const [rejectMode, setRejectMode] = useState(false);
  const [lyDo, setLyDo] = useState('');

  useEffect(() => {
    if (id) dispatch(fetchBookingDetail(id));
    return () => { dispatch(clearDetail()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  const handleConfirm = async () => {
    if (!detail) return;
    await dispatch(confirmBooking(detail.ma_dat_phong));
    dispatch(fetchPartnerBookings());
    navigate('/partner/bookings');
  };

  const handleReject = async () => {
    if (!detail || !lyDo.trim()) return alert('Nhập lý do từ chối');
    await dispatch(rejectBooking({ id: detail.ma_dat_phong, ly_do: lyDo }));
    dispatch(fetchPartnerBookings());
    navigate('/partner/bookings');
  };

  if (detailLoading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải chi tiết...</div>;
  }

  if (!detail) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy đơn đặt phòng</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/partner/bookings')}>
          ← Quay lại
        </button>
      </div>
    );
  }

  const isPending = detail.trang_thai === 'cho_xac_nhan';
  const st = TRANG_THAI[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };
  const nights = diffDays(detail.ngay_nhan_phong, detail.ngay_tra_phong);
  const payStatus = detail.thanh_toan?.trang_thai === 'thanh_cong' ? 'Đã thanh toán' : 'Chờ thanh toán';
  const payBadge = detail.thanh_toan?.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning';

  return (
    <div className="booking-detail-page">
      <ManagementHeader
        title="Quản Lý Đặt Phòng"
        subtitle={`Chi tiết đơn ${detail.ma_don_hang}`}
      />

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 12 }}
        onClick={() => navigate('/partner/bookings')}
      >
        ← Quay lại
      </button>

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {successMsg || error}
        </div>
      )}

      <div className="content-card booking-detail-page-card">
        <div className="booking-detail-status-bar booking-detail-status-bar--page">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span className="booking-detail-meta">Đặt lúc {formatDateTime(detail.ngay_dat)}</span>
          </div>
          {isPending && !rejectMode && (
            <TableActions style={{ justifyContent: 'flex-end' }}>
              <ActionButton variant="confirm" onClick={handleConfirm} disabled={loading}>Xác nhận</ActionButton>
              <ActionButton variant="reject" onClick={() => setRejectMode(true)}>Từ chối</ActionButton>
            </TableActions>
          )}
        </div>

        {rejectMode && (
          <div className="booking-reject-box">
            <label className="booking-reject-label">
              Lý do từ chối <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <textarea
              rows={3}
              className="booking-reject-textarea"
              placeholder="Nhập lý do từ chối để khách hàng biết..."
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
            />
            <div className="booking-reject-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejectMode(false)}>Hủy</button>
              <button type="button" className="btn btn-danger btn-sm" disabled={loading} onClick={handleReject}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}

        <DetailTable
          title="Thông tin phòng"
          rows={[
            { label: 'Khách sạn', value: detail.loai_phong?.khach_san?.ten },
            { label: 'Loại phòng', value: detail.loai_phong?.ten_loai },
            { label: 'Nhận phòng', value: formatDate(detail.ngay_nhan_phong) },
            { label: 'Trả phòng', value: formatDate(detail.ngay_tra_phong) },
            { label: 'Số đêm', value: `${nights} đêm` },
            { label: 'Số khách', value: `${detail.so_khach} khách` },
          ]}
          
        />

        <DetailTable
          title="Thông tin khách"
          rows={[
            { label: 'Họ tên', value: detail.khach_hang?.ho_ten },
            { label: 'Email', value: detail.khach_hang?.nguoi_dung?.email },
            { label: 'SĐT', value: detail.khach_hang?.nguoi_dung?.so_dien_thoai },
            { label: 'Người nhận phòng', value: detail.ten_nguoi_nhan },
            { label: 'SĐT người nhận', value: detail.sdt_nguoi_nhan },
            ...(detail.ghi_chu ? [{ label: 'Ghi chú', value: detail.ghi_chu }] : []),
          ]}
        />

        <DetailTable
          title="Thanh toán"
          rows={[
            { label: 'Tổng tiền gốc', value: formatCurrency(detail.tong_tien_goc) },
            ...(Number(detail.tien_giam) > 0
              ? [{ label: 'Giảm giá', value: `- ${formatCurrency(detail.tien_giam)}` }]
              : []),
            { label: 'Thành tiền', value: <strong style={{ color: '#3C7363' }}>{formatCurrency(detail.thanh_toan_cuoi)}</strong> },
            { label: 'Phương thức', value: PHUONG_THUC[detail.phuong_thuc_tt] || detail.phuong_thuc_tt },
            { label: 'Trạng thái TT', value: <span className={`badge ${payBadge}`}>{payStatus}</span> },
            ...(detail.khuyen_mai
              ? [{ label: 'Khuyến mãi', value: `${detail.khuyen_mai.ma_code} — ${detail.khuyen_mai.ten}` }]
              : []),
          ]}
        />
      </div>
    </div>
  );
}
