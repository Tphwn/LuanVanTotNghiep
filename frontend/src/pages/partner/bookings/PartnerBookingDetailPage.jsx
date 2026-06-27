import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ActionButton, { TableActions } from '../../../components/common/ActionButton';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import DetailTable from '../../../components/booking/DetailTable';
import BookingSectionTable from '../../../components/booking/BookingSectionTable';
import {
  fetchBookingDetail,
  checkInBooking,
  checkOutBooking,
  clearDetail,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import {
  TRANG_THAI,
  PHUONG_THUC,
  getPaymentDisplay,
  formatCurrency,
  formatDate,
  formatDateTime,
  diffDays,
} from '../../../utils/bookingDisplay';

const getPriceTypeLabel = (type) => {
  const labels = {
    co_ban: 'Cơ bản',
    cuoi_tuan: 'Cuối tuần',
    le_tet: 'Lễ tết',
    cao_diem: 'Cao điểm',
  };
  return labels[type] || 'Khác';
};

const getPriceTypeBadge = (type) => {
  const badges = {
    co_ban: 'badge-default',
    cuoi_tuan: 'badge-warning',
    le_tet: 'badge-danger',
    cao_diem: 'badge-info',
  };
  return badges[type] || 'badge-default';
};

const canCheckIn = (status) => ['da_xac_nhan', 'cho_xac_nhan'].includes(status);

export default function PartnerBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { detail, detailLoading, actionLoading, error, successMsg } = useSelector(
    (s) => s.partnerBooking || {},
  );

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

  const bookingStatus = useMemo(() => {
    if (!detail) return { label: '—', cls: 'badge-default' };
    return TRANG_THAI[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };
  }, [detail]);

  const paymentInfo = useMemo(() => getPaymentDisplay(detail), [detail]);

  const roomRows = useMemo(() => {
    if (!detail) return [];
    const nights = diffDays(detail.ngay_nhan_phong, detail.ngay_tra_phong);
    return [
      { label: 'Khách sạn', value: detail.loai_phong?.khach_san?.ten || '—' },
      { label: 'Loại phòng', value: detail.loai_phong?.ten_loai || '—' },
      { label: 'Nhận phòng', value: formatDate(detail.ngay_nhan_phong) },
      { label: 'Trả phòng', value: formatDate(detail.ngay_tra_phong) },
      { label: 'Số đêm', value: `${nights} đêm` },
      { label: 'Số khách', value: `${detail.so_khach || 0} khách` },
    ];
  }, [detail]);

  const guestRows = useMemo(() => {
    if (!detail) return [];
    return [
      { label: 'Khách hàng', value: detail.khach_hang?.ho_ten || '—' },
      { label: 'Email', value: detail.khach_hang?.nguoi_dung?.email || '—' },
      { label: 'SĐT', value: detail.khach_hang?.nguoi_dung?.so_dien_thoai || '—' },
      { label: 'Người nhận phòng', value: detail.ten_nguoi_nhan || '—' },
      { label: 'SĐT người nhận', value: detail.sdt_nguoi_nhan || '—' },
      { label: 'Ghi chú', value: detail.ghi_chu || '—' },
    ];
  }, [detail]);

  const handleBack = () => navigate('/partner/bookings');

  const handleCheckIn = async () => {
    if (!detail) return;
    if (!window.confirm(`Xác nhận khách đã check-in cho đơn ${detail.ma_don_hang}?`)) return;
    await dispatch(checkInBooking(detail.ma_dat_phong));
  };

  const handleCheckOut = async () => {
    if (!detail) return;
    if (!window.confirm(`Xác nhận khách đã check-out cho đơn ${detail.ma_don_hang}?`)) return;
    await dispatch(checkOutBooking(detail.ma_dat_phong));
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
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy đơn đặt phòng</p>
        <BackButton variant="outline" onClick={handleBack} />
      </div>
    );
  }

  const showCheckInAction = canCheckIn(detail.trang_thai);
  const showCheckOutAction = detail.trang_thai === 'da_checkin';

  const paymentMethod =
    PHUONG_THUC[detail.phuong_thuc_tt] || detail.thanh_toan?.phuong_thuc || detail.phuong_thuc_tt || '—';

  const paymentRows = [
    {
      key: 'payment',
      cells: [
        formatCurrency(detail.thanh_toan_cuoi),
        <span className={`badge ${paymentInfo.badge}`}>{paymentInfo.label}</span>,
        paymentMethod,
      ],
      cellProps: [{ style: { fontWeight: 500 } }, {}, {}],
    },
  ];

  const nightlyRows = (detail.chi_tiet_dat_phong || []).map((item) => ({
    key: item.ma_chi_tiet,
    cells: [
      formatDate(item.ngay),
      formatCurrency(item.don_gia),
      <span className={`badge ${getPriceTypeBadge(item.loai_gia)}`}>
        {getPriceTypeLabel(item.loai_gia)}
      </span>,
    ],
    cellProps: [{}, { style: { fontWeight: 500 } }, {}],
  }));

  return (
    <div className="booking-detail-page mgmt-page">
      <ManagementHeader
        title="Quản lý đặt phòng"
        subtitle={`Chi tiết đơn ${detail.ma_don_hang}`}
        onBack={handleBack}
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {successMsg || error}
        </div>
      )}

      <div className="content-card booking-detail-page-card">
        <div className="booking-detail-status-bar booking-detail-status-bar--page">
          <div className="booking-detail-status-left">
            <span className={`badge ${bookingStatus.cls}`}>{bookingStatus.label}</span>
            <span className="booking-detail-meta">Đặt lúc {formatDateTime(detail.ngay_dat)}</span>
          </div>
          {showCheckInAction && (
            <TableActions style={{ justifyContent: 'flex-end' }}>
              <ActionButton variant="confirm" onClick={handleCheckIn} disabled={actionLoading}>
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận check-in'}
              </ActionButton>
            </TableActions>
          )}
          {showCheckOutAction && (
            <TableActions style={{ justifyContent: 'flex-end' }}>
              <ActionButton variant="confirm" onClick={handleCheckOut} disabled={actionLoading}>
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận check-out'}
              </ActionButton>
            </TableActions>
          )}
        </div>

        <div className="booking-detail-grid">
          <DetailTable title="Thông tin phòng" rows={roomRows} />
          <DetailTable title="Thông tin khách" rows={guestRows} />
        </div>

        <BookingSectionTable
          title="Thanh toán"
          columns={['Tổng tiền', 'Trạng thái', 'Phương thức']}
          rows={paymentRows}
        />

        <BookingSectionTable
          title="Chi tiết giá từng đêm"
          columns={['Ngày', 'Giá/đêm', 'Loại giá']}
          rows={nightlyRows}
        />
      </div>
    </div>
  );
}
