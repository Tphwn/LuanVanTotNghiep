import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DetailTable from '../../../../components/booking/DetailTable';
import {
  fetchTransactionById,
  clearDetail,
} from '../../../../store/slices/adminFinanceSlice';
import { formatCurrency } from '../../../../utils/bookingDisplay';

const TX_STATUS = {
  cho: { label: 'Chờ', cls: 'badge-warning' },
  thanh_cong: { label: 'Thành công', cls: 'badge-success' },
  that_bai: { label: 'Thất bại', cls: 'badge-danger' },
};

const formatPaymentDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${d.toLocaleDateString('vi-VN')} - ${time}`;
};

const getCustomerName = (tx) =>
  tx.khach_hang_ten || tx.dat_phong?.khach_hang?.ho_ten || tx.dat_phong?.ten_nguoi_nhan || '—';

const getCustomerPhone = (tx) =>
  tx.khach_hang_sdt || tx.dat_phong?.khach_hang?.nguoi_dung?.so_dien_thoai || tx.dat_phong?.sdt_nguoi_nhan || '—';

const getHotelName = (tx) => tx.dat_phong?.loai_phong?.khach_san?.ten || '—';

const getRoomType = (tx) => tx.dat_phong?.loai_phong?.ten_loai || '—';

const getPartnerName = (tx) =>
  tx.ten_doi_tac || tx.dat_phong?.loai_phong?.khach_san?.doi_tac?.ten_cong_ty || '—';

export default function TransactionDetailModal({ id, onClose }) {
  const dispatch = useDispatch();
  const { txDetail, detailLoading } = useSelector((s) => s.adminFinance || {});

  useEffect(() => {
    if (id) dispatch(fetchTransactionById(id));
    return () => { dispatch(clearDetail()); };
  }, [dispatch, id]);

  const txStatus = useMemo(() => {
    if (!txDetail) return { label: '—', cls: 'badge-default' };
    return TX_STATUS[txDetail.trang_thai] || { label: txDetail.trang_thai, cls: 'badge-default' };
  }, [txDetail]);

  const generalRows = useMemo(() => {
    if (!txDetail) return [];
    return [
      { label: 'Mã giao dịch', value: txDetail.ma_giao_dich || '—' },
      { label: 'Số tiền', value: formatCurrency(txDetail.so_tien) },
      { label: 'Cổng thanh toán', value: txDetail.cong_thanh_toan || txDetail.phuong_thuc || '—' },
      { label: 'Thời gian tạo', value: formatPaymentDateTime(txDetail.thoi_gian) },
      { label: 'Cập nhật lúc', value: formatPaymentDateTime(txDetail.ngay_cap_nhat) },
    ];
  }, [txDetail]);

  const reconcileRows = useMemo(() => {
    if (!txDetail) return [];
    const bookingId = txDetail.ma_dat_phong || txDetail.dat_phong?.ma_dat_phong;
    const orderCode = txDetail.ma_don_hang || txDetail.dat_phong?.ma_don_hang;

    return [
      { label: 'Khách hàng', value: getCustomerName(txDetail) },
      { label: 'Số điện thoại', value: getCustomerPhone(txDetail) },
      { label: 'Khách sạn', value: getHotelName(txDetail) },
      { label: 'Loại phòng', value: getRoomType(txDetail) },
      { label: 'Đối tác', value: getPartnerName(txDetail) },
      {
        label: 'Mã đặt phòng',
        value: bookingId ? (
          <Link to={`/admin/bookings/${bookingId}`} className="mgmt-link">
            {orderCode || bookingId}
          </Link>
        ) : (orderCode || '—'),
      },
      { label: 'Phương thức thanh toán', value: txDetail.cong_thanh_toan || txDetail.phuong_thuc || '—' },
      {
        label: 'Mã tham chiếu đối tác',
        value: txDetail.ma_tham_chieu ? (
          <span style={{ fontWeight: 700, color: '#3C7363' }}>{txDetail.ma_tham_chieu}</span>
        ) : '—',
      },
    ];
  }, [txDetail]);

  const showError = txDetail
    && (txDetail.trang_thai === 'that_bai' || txDetail.ma_loi || txDetail.thong_bao_loi);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box finance-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            Chi tiết giao dịch {txDetail?.ma_giao_dich ? `${txDetail.ma_giao_dich}` : ''}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="finance-detail-modal-body">
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
              Đang tải chi tiết giao dịch...
            </div>
          ) : !txDetail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
              Không tìm thấy giao dịch
            </div>
          ) : (
            <>
              <div className="booking-detail-status-bar" style={{ marginBottom: 16 }}>
                <span className={`badge ${txStatus.cls}`}>{txStatus.label}</span>
              </div>

              <div className="booking-detail-grid">
                <DetailTable title="Thông tin chung" rows={generalRows} />
                <DetailTable title="Thông tin đối chiếu" rows={reconcileRows} />
              </div>

              {showError && (
                <div className="booking-detail-error-box" style={{ marginTop: 16 }}>
                  <h4 className="booking-detail-section-title">Chi tiết lỗi từ hệ thống</h4>
                  <DetailTable
                    rows={[
                      { label: 'Mã lỗi', value: txDetail.ma_loi || '—' },
                      { label: 'Thông điệp', value: txDetail.thong_bao_loi || '—' },
                      { label: 'Hướng xử lý', value: txDetail.huong_xu_ly || '—' },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="finance-detail-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
