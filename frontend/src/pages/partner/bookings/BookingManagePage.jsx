import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPartnerBookings,
  fetchBookingDetail,
  confirmBooking,
  rejectBooking,
  clearMsg,
  clearDetail
} from '../../../store/slices/partnerBookingSlice';
import { Eye, Check } from 'lucide-react';
import ActionButton, { ActionCell, TableActions } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SummaryStats from '../../../components/common/management/SummaryStats';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';
// ===== CONSTANTS =====
const TRANG_THAI = {
  cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'badge-warning'},
  da_xac_nhan:  { label:'Đã xác nhận',  cls: 'badge-info'},
  hoan_thanh:   { label:'Hoàn thành',   cls: 'badge-success'},
  da_huy:       { label:'Đã hủy',       cls: 'badge-danger'},
  tu_choi:      { label:'Từ chối',      cls: 'badge-danger'},
};

const PHUONG_THUC = {
  truc_tuyen:' Trực tuyến',
  tai_khach_san:    'Tại khách sạn',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND'}).format(amount || 0);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('vi-VN') : '—';

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—';

const diffDays = (from, to) => {
  const d = new Date(to) - new Date(from);
  return Math.ceil(d / (1000 * 60 * 60 * 24));
};

// ===== DETAIL TABLE =====
const DetailTable = ({ title, rows }) => (
  <div className="booking-detail-section">
    {title && <h4 className="booking-detail-section-title">{title}</h4>}
    <table className="booking-detail-table">
      <tbody>
        {rows.map(({ label, value }) => (
          <tr key={label}>
            <th>{label}</th>
            <td>{value ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ===== MODAL CHI TIẾT =====
const BookingDetailModal = ({ booking, onClose, onConfirm, onReject, loading }) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [ly_do, setLyDo] = useState('');

  if (!booking) return null;

  const isPending = booking.trang_thai === 'cho_xac_nhan';
  const st = TRANG_THAI[booking.trang_thai] || { label: booking.trang_thai, cls: 'badge-default' };
  const nights = diffDays(booking.ngay_nhan_phong, booking.ngay_tra_phong);
  const payStatus = booking.thanh_toan?.trang_thai === 'thanh_cong' ? 'Đã thanh toán' : 'Chờ thanh toán';
  const payBadge = booking.thanh_toan?.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box booking-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Chi tiết đặt phòng</h3>
            <p className="booking-detail-code">#{booking.ma_don_hang}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="booking-detail-status-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span className="booking-detail-meta">Đặt lúc {formatDateTime(booking.ngay_dat)}</span>
          </div>
          {isPending && !rejectMode && (
            <TableActions style={{ justifyContent: 'flex-end' }}>
              <ActionButton variant="confirm" onClick={onConfirm} disabled={loading}>Xác nhận</ActionButton>
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
              value={ly_do}
              onChange={(e) => setLyDo(e.target.value)}
            />
            <div className="booking-reject-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejectMode(false)}>Hủy</button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={() => {
                  if (!ly_do.trim()) return alert('Nhập lý do từ chối');
                  onReject(ly_do);
                }}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}

        <DetailTable
          title="Thông tin phòng"
          rows={[
            { label: 'Khách sạn', value: booking.loai_phong?.khach_san?.ten },
            { label: 'Loại phòng', value: booking.loai_phong?.ten_loai },
            { label: 'Nhận phòng', value: formatDate(booking.ngay_nhan_phong) },
            { label: 'Trả phòng', value: formatDate(booking.ngay_tra_phong) },
            { label: 'Số đêm', value: `${nights} đêm` },
            { label: 'Số khách', value: `${booking.so_khach} khách` },
          ]}
        />

        <DetailTable
          title="Thông tin khách"
          rows={[
            { label: 'Họ tên', value: booking.khach_hang?.ho_ten },
            { label: 'Email', value: booking.khach_hang?.nguoi_dung?.email },
            { label: 'SĐT', value: booking.khach_hang?.nguoi_dung?.so_dien_thoai },
            { label: 'Người nhận phòng', value: booking.ten_nguoi_nhan },
            { label: 'SĐT người nhận', value: booking.sdt_nguoi_nhan },
            ...(booking.ghi_chu ? [{ label: 'Ghi chú', value: booking.ghi_chu }] : []),
          ]}
        />

        <DetailTable
          title="Thanh toán"
          rows={[
            { label: 'Tổng tiền gốc', value: formatCurrency(booking.tong_tien_goc) },
            ...(Number(booking.tien_giam) > 0
              ? [{ label: 'Giảm giá', value: `- ${formatCurrency(booking.tien_giam)}` }]
              : []),
            { label: 'Thành tiền', value: <strong style={{ color: '#3C7363' }}>{formatCurrency(booking.thanh_toan_cuoi)}</strong> },
            { label: 'Phương thức', value: PHUONG_THUC[booking.phuong_thuc_tt] || booking.phuong_thuc_tt },
            { label: 'Trạng thái TT', value: <span className={`badge ${payBadge}`}>{payStatus}</span> },
            ...(booking.khuyen_mai
              ? [{ label: 'Khuyến mãi', value: `${booking.khuyen_mai.ma_code} — ${booking.khuyen_mai.ten}` }]
              : []),
          ]}
        />
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const BookingManagePage = () => {
  const dispatch = useDispatch();
  const {
  list = [],
  detail = null,
  loading = false,
  detailLoading = false,
  error = null,
  successMsg = null
} = useSelector((state) => state.partnerBooking || {});

  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    dispatch(fetchPartnerBookings());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error]);

  const handleViewDetail = (id) => {
    dispatch(fetchBookingDetail(id));
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    dispatch(clearDetail());
  };

  const handleConfirm = async () => {
    if (!detail) return;
    await dispatch(confirmBooking(detail.ma_dat_phong));
    handleCloseDetail();
  };

  const handleReject = async (ly_do) => {
    if (!detail) return;
    await dispatch(rejectBooking({ id: detail.ma_dat_phong, ly_do }));
    handleCloseDetail();
  };

  // Lọc
  const filtered = list.filter((b) => {
    let matchStatus = statusFilter === 'all' || b.trang_thai === statusFilter;
    if (statusFilter === 'da_huy') {
      matchStatus = ['da_huy', 'tu_choi'].includes(b.trang_thai);
    }
    const text = keyword.toLowerCase();
    const matchKeyword = !keyword ||
      b.ma_don_hang?.toLowerCase().includes(text) ||
      b.ten_nguoi_nhan?.toLowerCase().includes(text) ||
      b.sdt_nguoi_nhan?.includes(text) ||
      b.khach_hang?.ho_ten?.toLowerCase().includes(text);
    return matchStatus && matchKeyword;
  });

  const countByStatus = (s) => list.filter((b) => b.trang_thai === s).length;

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: list.length },
    { id: 'cho_xac_nhan', label: 'Chờ xác nhận', count: countByStatus('cho_xac_nhan') },
    { id: 'da_xac_nhan', label: 'Đã xác nhận', count: countByStatus('da_xac_nhan') },
    { id: 'hoan_thanh', label: 'Hoàn thành', count: countByStatus('hoan_thanh') },
    { id: 'da_huy', label: 'Đã hủy', count: countByStatus('da_huy') + countByStatus('tu_choi') },
  ], [list]);

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Đặt phòng"
        subtitle="Xem và xử lý các đơn đặt phòng của khách sạn bạn"
      />

      {successMsg && <div className="mgmt-toast success">{successMsg}</div>}
      {error && <div className="mgmt-toast error">{error}</div>}

      <SummaryStats
        items={[
          { label: 'Tổng đơn', value: list.length, color: '#1a2e28' },
          { label: 'Chờ xác nhận', value: countByStatus('cho_xac_nhan'), color: '#b36b00' },
          { label: 'Đã xác nhận', value: countByStatus('da_xac_nhan'), color: '#0958d9' },
          { label: 'Hoàn thành', value: countByStatus('hoan_thanh'), color: '#1a7a4a' },
        ]}
      />

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm mã đơn, tên khách, SĐT..."
        />
      </div>

      <FilterTabs tabs={filterTabs} active={statusFilter} onChange={setStatusFilter} />

      <div className="mgmt-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đơn đặt phòng nào</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table">
              <colgroup>
                <col style={{ width: 100 }} />
                <col />
                <col />
                <col style={{ width: 96 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 110 }} />
                <col className="mgmt-col-status" />
                <col className="mgmt-col-status" />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Khách sạn / Phòng</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const st = TRANG_THAI[b.trang_thai] || { label: b.trang_thai, cls: 'badge-default' };
                  const isPending = b.trang_thai === 'cho_xac_nhan';
                  return (
                    <tr key={b.ma_dat_phong}>
                      <td style={{ fontWeight: 500, color: '#3C7363' }}>#{b.ma_don_hang}</td>
                      <td>
                        <div className="mgmt-cell-name">{b.ten_nguoi_nhan}</div>
                        <div className="mgmt-cell-sub">{b.sdt_nguoi_nhan}</div>
                      </td>
                      <td>
                        <div className="mgmt-cell-name">{b.loai_phong?.khach_san?.ten}</div>
                        <div className="mgmt-cell-sub">{b.loai_phong?.ten_loai}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{formatDate(b.ngay_nhan_phong)}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(b.ngay_tra_phong)}</td>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{formatCurrency(b.thanh_toan_cuoi)}</td>
                      <td>
                        <span className={`badge ${b.thanh_toan?.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                          {b.thanh_toan?.trang_thai === 'thanh_cong' ? 'Đã TT' : 'Chờ TT'}
                        </span>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => handleViewDetail(b.ma_dat_phong)}
                        />
                        <ActionButton
                          variant="confirm"
                          iconOnly
                          icon={Check}
                          title="Xác nhận"
                          disabled={!isPending}
                          onClick={async () => {
                            await dispatch(fetchBookingDetail(b.ma_dat_phong));
                            await dispatch(confirmBooking(b.ma_dat_phong));
                          }}
                        />
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showDetail && (
        detailLoading ? (
          <div className="modal-overlay">
            <div className="modal-box" style={{ textAlign: 'center', padding: 40 }}>
               Đang tải chi tiết...
            </div>
          </div>
        ) : (
          <BookingDetailModal
            booking={detail}
            onClose={handleCloseDetail}
            onConfirm={handleConfirm}
            onReject={handleReject}
            loading={loading}
          />
        )
      )}
    </div>
  );
};

export default BookingManagePage;