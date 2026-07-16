import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DetailTable from '../../../../components/booking/DetailTable';
import {
  fetchCommissionById,
  clearCommissionDetail,
} from '../../../../store/slices/adminFinanceSlice';
import { formatCurrency } from '../../../../utils/bookingDisplay';

const COMM_STATUS = {
  chua_thu: { label: 'Chờ đối soát', cls: 'badge-warning' },
  da_thu: { label: 'Đã đối soát', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
  da_thanh_toan: { label: 'Đã thanh toán ĐT', cls: 'badge-info' },
};

const PAYMENT_STATUS = {
  cho: { label: 'Chờ', cls: 'badge-warning' },
  thanh_cong: { label: 'Thành công', cls: 'badge-success' },
  that_bai: { label: 'Thất bại', cls: 'badge-danger' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date.toLocaleDateString('vi-VN')} ${time}`;
};

const getCustomerLabel = (dp) => {
  const name = dp?.khach_hang?.ho_ten || dp?.ten_nguoi_nhan;
  const phone = dp?.khach_hang?.nguoi_dung?.so_dien_thoai || dp?.sdt_nguoi_nhan;
  if (!name) return '—';
  return phone ? `${name} (${phone})` : name;
};

const CommissionDetailModal = ({ commissionId, onClose }) => {
  const dispatch = useDispatch();
  const { commissionDetail: detail, commissionDetailLoading: loading } = useSelector(
    (s) => s.adminFinance || {},
  );

  useEffect(() => {
    if (commissionId) {
      dispatch(fetchCommissionById(commissionId));
    }
    return () => {
      dispatch(clearCommissionDetail());
    };
  }, [commissionId, dispatch]);

  const st = useMemo(() => {
    if (!detail) return { label: '—', cls: 'badge-default' };
    return COMM_STATUS[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };
  }, [detail]);

  const paySt = useMemo(() => {
    const code = detail?.dat_phong?.thanh_toan?.trang_thai;
    if (!code) return { label: '—', cls: 'badge-default' };
    return PAYMENT_STATUS[code] || { label: code, cls: 'badge-default' };
  }, [detail]);

  const orderRows = useMemo(() => {
    if (!detail) return [];
    const dp = detail.dat_phong;
    const bookingId = dp?.ma_dat_phong;
    const orderCode = dp?.ma_don_hang;
    return [
      {
        label: 'Mã đơn',
        value: bookingId ? (
          <Link to={`/admin/bookings/${bookingId}`} className="mgmt-link">
            {orderCode || `#${bookingId}`}
          </Link>
        ) : (orderCode || '—'),
      },
      { label: 'Khách hàng', value: getCustomerLabel(dp) },
      { label: 'Khách sạn', value: dp?.loai_phong?.khach_san?.ten || '—' },
      { label: 'Đối tác', value: detail.doi_tac?.ten_cong_ty || '—' },
      { label: 'Loại phòng', value: dp?.loai_phong?.ten_loai || '—' },
      { label: 'Ngày nhận phòng', value: fmtDate(dp?.ngay_nhan_phong) },
      { label: 'Ngày trả phòng', value: fmtDate(dp?.ngay_tra_phong) },
      { label: 'Ngày hoàn thành', value: fmtDate(detail.ngay_hoan_thanh || detail.ngay_tinh) },
    ];
  }, [detail]);

  const moneyRows = useMemo(() => {
    if (!detail) return [];
    const dp = detail.dat_phong;
    return [
      { label: 'Tổng tiền trước giảm', value: formatCurrency(dp?.tong_tien_goc) },
      { label: 'Số tiền khuyến mãi', value: formatCurrency(dp?.tien_giam) },
      { label: 'Tổng tiền thanh toán', value: formatCurrency(detail.doanh_thu_don ?? dp?.thanh_toan_cuoi) },
      {
        label: 'Trạng thái thanh toán',
        value: <span className={`badge ${paySt.cls}`}>{paySt.label}</span>,
      },
    ];
  }, [detail, paySt]);

  const commissionRows = useMemo(() => {
    if (!detail) return [];
    const tienHh = Number(detail.so_tien_hoa_hong) || 0;
    const doanhThu = Number(detail.doanh_thu_don ?? detail.dat_phong?.thanh_toan_cuoi) || 0;
    const tienDoiTac = detail.tien_doi_tac_nhan ?? Math.max(0, doanhThu - tienHh);
    const adminEmail = detail.admin_doi_soat?.email || detail.doi_soat_boi?.email;
    const rows = [
      { label: 'Tỷ lệ hoa hồng', value: `${detail.ty_le_hoa_hong}%` },
      { label: 'Tiền hoa hồng hệ thống', value: formatCurrency(tienHh) },
      { label: 'Tiền đối tác nhận', value: formatCurrency(tienDoiTac) },
      {
        label: 'Trạng thái đối soát',
        value: <span className={`badge ${st.cls}`}>{st.label}</span>,
      },
      { label: 'Ngày đối soát', value: fmtDateTime(detail.ngay_doi_soat) },
      { label: 'Admin đối soát', value: adminEmail || '—' },
    ];
    if (detail.ghi_chu?.trim()) {
      rows.push({ label: 'Ghi chú', value: detail.ghi_chu.trim() });
    }
    return rows;
  }, [detail, st]);

  if (!commissionId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box finance-detail-modal"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            Chi tiết hoa hồng
            {detail?.dat_phong?.ma_don_hang ? ` #${detail.dat_phong.ma_don_hang}` : ''}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="finance-detail-modal-body">
          {loading && !detail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
              Đang tải chi tiết hoa hồng...
            </div>
          ) : !detail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
              Không tìm thấy dữ liệu
            </div>
          ) : (
            <>
              <div className="booking-detail-status-bar" style={{ marginBottom: 16 }}>
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </div>
              <div className="booking-detail-grid">
                <DetailTable title="Thông tin đơn" rows={orderRows} />
                <DetailTable title="Thông tin tiền" rows={moneyRows} />
                <DetailTable title="Thông tin hoa hồng" rows={commissionRows} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default CommissionDetailModal;
