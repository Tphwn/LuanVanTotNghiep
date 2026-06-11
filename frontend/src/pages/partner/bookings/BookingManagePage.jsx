import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPartnerBookings,
  fetchBookingDetail,
  confirmBooking,
  rejectBooking,
  clearMsg,
  clearDetail
} from '../../../store/slices/partnerBookingSlice';
// ===== CONSTANTS =====
const TRANG_THAI = {
  cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'badge-warning' },
  da_xac_nhan:  { label: 'Đã xác nhận',  cls: 'badge-info' },
  hoan_thanh:   { label: 'Hoàn thành',   cls: 'badge-success' },
  da_huy:       { label: 'Đã hủy',       cls: 'badge-danger' },
  tu_choi:      { label: 'Từ chối',      cls: 'badge-danger' },
};

const PHUONG_THUC = {
  truc_tuyen:       '💳 Trực tuyến',
  tai_khach_san:    '💵 Tại khách sạn',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('vi-VN') : '—';

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('vi-VN') : '—';

const diffDays = (from, to) => {
  const d = new Date(to) - new Date(from);
  return Math.ceil(d / (1000 * 60 * 60 * 24));
};

// ===== INFO ROW =====
const InfoRow = ({ label, value }) => (
  <div style={{
    display: 'flex', padding: '9px 0',
    borderBottom: '0.5px solid #f0f0f0', fontSize: 14, gap: 12,
  }}>
    <span style={{ width: 170, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500, flex: 1 }}>{value || '—'}</span>
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">📋 Chi tiết đặt phòng</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Trạng thái + hành động */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
          padding: '10px 14px', background: '#f8fdfb',
          borderRadius: 8, border: '1px solid #d4ede6',
        }}>
          <div>
            <span style={{ fontSize: 13, color: '#5a7a72' }}>Trạng thái: </span>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          {isPending && !rejectMode && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={onConfirm} disabled={loading}>
                ✓ Xác nhận
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setRejectMode(true)}>
                ✕ Từ chối
              </button>
            </div>
          )}
        </div>

        {/* Form từ chối */}
        {rejectMode && (
          <div style={{
            marginBottom: 16, padding: 14,
            background: '#fff0f0', borderRadius: 8,
            border: '1px solid #ffb3b3',
          }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Lý do từ chối <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối để khách hàng biết..."
              value={ly_do}
              onChange={e => setLyDo(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #ffb3b3', borderRadius: 8,
                fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setRejectMode(false)}>Hủy</button>
              <button
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

        <div className="form-grid">
          {/* Thông tin đặt phòng */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>
              🏨 Thông tin phòng
            </h4>
            <InfoRow label="Mã đơn" value={`#${booking.ma_don_hang}`} />
            <InfoRow label="Khách sạn" value={booking.loai_phong?.khach_san?.ten} />
            <InfoRow label="Loại phòng" value={booking.loai_phong?.ten_loai} />
            <InfoRow label="Nhận phòng" value={formatDate(booking.ngay_nhan_phong)} />
            <InfoRow label="Trả phòng" value={formatDate(booking.ngay_tra_phong)} />
            <InfoRow label="Số đêm" value={`${nights} đêm`} />
            <InfoRow label="Số khách" value={`${booking.so_khach} khách`} />
            <InfoRow label="Ngày đặt" value={formatDateTime(booking.ngay_dat)} />
          </div>

          {/* Thông tin khách */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>
              👤 Thông tin khách
            </h4>
            <InfoRow label="Họ tên" value={booking.khach_hang?.ho_ten} />
            <InfoRow label="Email" value={booking.khach_hang?.nguoi_dung?.email} />
            <InfoRow label="SĐT" value={booking.khach_hang?.nguoi_dung?.so_dien_thoai} />
            <InfoRow label="Người nhận phòng" value={booking.ten_nguoi_nhan} />
            <InfoRow label="SĐT người nhận" value={booking.sdt_nguoi_nhan} />
            {booking.ghi_chu && (
              <InfoRow label="Ghi chú" value={booking.ghi_chu} />
            )}
          </div>
        </div>

        {/* Thanh toán */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>
            💳 Thanh toán
          </h4>
          <div style={{
            background: '#f8fdfb', borderRadius: 8,
            border: '1px solid #d4ede6', padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: '#5a7a72' }}>Tổng tiền gốc</span>
              <span>{formatCurrency(booking.tong_tien_goc)}</span>
            </div>
            {booking.tien_giam > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                <span style={{ color: '#5a7a72' }}>Giảm giá</span>
                <span style={{ color: '#e05c5c' }}>- {formatCurrency(booking.tien_giam)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 8, borderTop: '0.5px solid #d4ede6',
              fontWeight: 700, fontSize: 16,
            }}>
              <span>Thành tiền</span>
              <span style={{ color: '#3C7363' }}>{formatCurrency(booking.thanh_toan_cuoi)}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#5a7a72' }}>
              Phương thức: {PHUONG_THUC[booking.phuong_thuc_tt] || booking.phuong_thuc_tt}
              {booking.thanh_toan && (
                <span style={{ marginLeft: 12 }}>
                  · TT: <span className={`badge ${booking.thanh_toan.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                    {booking.thanh_toan.trang_thai === 'thanh_cong' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Khuyến mãi */}
        {booking.khuyen_mai && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#854F0B' }}>
            🎟️ Mã KM: <strong>{booking.khuyen_mai.ma_code}</strong> — {booking.khuyen_mai.ten}
          </div>
        )}
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
  const filtered = list.filter(b => {
    const matchStatus = statusFilter === 'all' || b.trang_thai === statusFilter;
    const text = keyword.toLowerCase();
    const matchKeyword = !keyword ||
      b.ma_don_hang?.toLowerCase().includes(text) ||
      b.ten_nguoi_nhan?.toLowerCase().includes(text) ||
      b.sdt_nguoi_nhan?.includes(text) ||
      b.khach_hang?.ho_ten?.toLowerCase().includes(text);
    return matchStatus && matchKeyword;
  });

  // Stats
  const countByStatus = (s) => list.filter(b => b.trang_thai === s).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Đặt phòng</h1>
          <p className="page-subtitle">Xem và xử lý các đơn đặt phòng của khách sạn bạn</p>
        </div>
      </div>

      {/* Toast */}
      {successMsg && (
        <div style={{
          background: '#e8f5f1', border: '1px solid #8FD9C4',
          color: '#3C7363', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>✅ {successMsg}</div>
      )}
      {error && (
        <div style={{
          background: '#fff0f0', border: '1px solid #ffb3b3',
          color: '#e05c5c', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>❌ {error}</div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
        {[
          { label: 'Tổng đơn',      value: list.length,                        color: '#3C7363' },
          { label: 'Chờ xác nhận',  value: countByStatus('cho_xac_nhan'),      color: '#b36b00' },
          { label: 'Đã xác nhận',   value: countByStatus('da_xac_nhan'),       color: '#0958d9' },
          { label: 'Hoàn thành',    value: countByStatus('hoan_thanh'),        color: '#52c41a' },
          { label: 'Đã hủy/Từ chối', value: countByStatus('da_huy') + countByStatus('tu_choi'), color: '#e05c5c' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          className="search-input"
          placeholder="🔍 Tìm mã đơn, tên khách, SĐT..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ flex: 2 }}
        />
        <select
          className="search-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="cho_xac_nhan">Chờ xác nhận</option>
          <option value="da_xac_nhan">Đã xác nhận</option>
          <option value="hoan_thanh">Hoàn thành</option>
          <option value="da_huy">Đã hủy</option>
          <option value="tu_choi">Từ chối</option>
        </select>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách đơn ({filtered.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>⏳ Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">Không có đơn đặt phòng nào</p>
          </div>
        ) : (
          <table className="data-table">
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
              {filtered.map(b => {
                const st = TRANG_THAI[b.trang_thai] || { label: b.trang_thai, cls: 'badge-default' };
                const isPending = b.trang_thai === 'cho_xac_nhan';
                return (
                  <tr key={b.ma_dat_phong}>
                    <td style={{ fontWeight: 500, color: '#3C7363' }}>#{b.ma_don_hang}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.ten_nguoi_nhan}</div>
                      <div style={{ fontSize: 12, color: '#5a7a72' }}>{b.sdt_nguoi_nhan}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.loai_phong?.khach_san?.ten}</div>
                      <div style={{ fontSize: 12, color: '#5a7a72' }}>{b.loai_phong?.ten_loai}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{formatDate(b.ngay_nhan_phong)}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(b.ngay_tra_phong)}</td>
                    <td style={{ fontWeight: 500 }}>{formatCurrency(b.thanh_toan_cuoi)}</td>
                    <td>
                      <span className={`badge ${b.thanh_toan?.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                        {b.thanh_toan?.trang_thai === 'thanh_cong' ? 'Đã TT' : 'Chờ TT'}
                      </span>
                    </td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleViewDetail(b.ma_dat_phong)}
                        >
                          Chi tiết
                        </button>
                        {isPending && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={async () => {
                              await dispatch(fetchBookingDetail(b.ma_dat_phong));
                              await dispatch(confirmBooking(b.ma_dat_phong));
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal chi tiết */}
      {showDetail && (
        detailLoading ? (
          <div className="modal-overlay">
            <div className="modal-box" style={{ textAlign: 'center', padding: 40 }}>
              ⏳ Đang tải chi tiết...
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