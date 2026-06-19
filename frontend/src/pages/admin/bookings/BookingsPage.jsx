import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminBookings, fetchAdminBookingDetail,
  cancelAdminBooking, fetchBookingStats,
  fetchHotelsForFilter, clearMsg, clearDetail,
} from '../../../store/slices/adminBookingSlice';
import { Eye } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
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
  tai_khach_san: 'Tại khách sạn',
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND'}).format(v || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

const diffDays = (a, b) =>
  Math.ceil((new Date(b) - new Date(a)) / 86400000);

// ===== INFO ROW =====
const InfoRow = ({ label, value }) => (
  <div style={{
    display: 'flex', padding: '9px 0',
    borderBottom: '0.5px solid #f0f0f0',
    fontSize: 14, gap: 12,
  }}>
    <span style={{ width: 180, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500, flex: 1 }}>{value || '—'}</span>
  </div>
);

// ===== MODAL CHI TIẾT =====
const BookingDetailModal = ({ booking, onClose, onCancel, loading }) => {
  const [cancelMode, setCancelMode] = useState(false);
  const [lyDo, setLyDo] = useState('');

  if (!booking) return null;

  const st = TRANG_THAI[booking.trang_thai] || { label: booking.trang_thai, cls: 'badge-default'};
  const nights = diffDays(booking.ngay_nhan_phong, booking.ngay_tra_phong);
  const canCancel = !['hoan_thanh', 'da_huy', 'tu_choi'].includes(booking.trang_thai);

  return (
    <div className="modal-overlay"onClick={onClose}>
      <div
        className="modal-box"style={{ maxWidth: 720, maxHeight: '92vh', overflowY: 'auto'}}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title"> Chi tiết đơn đặt phòng</h3>
            <p style={{ fontSize: 13, color:'#5a7a72', margin: '2px 0 0'}}>
              #{booking.ma_don_hang}
            </p>
          </div>
          <button className="modal-close"onClick={onClose}>×</button>
        </div>

        {/* Trạng thái bar */}
        <div style={{
          display:'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', background: '#f8fdfb',
          borderRadius: 8, border: '1px solid #d4ede6', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span style={{ fontSize: 13, color: '#5a7a72'}}>
              Đặt lúc {formatDateTime(booking.ngay_dat)}
            </span>
          </div>
          {canCancel && !cancelMode && (
            <button
              className="btn btn-danger btn-sm"onClick={() => setCancelMode(true)}
            >
               Hủy đơn (Admin)
            </button>
          )}
        </div>

        {/* Form hủy */}
        {cancelMode && (
          <div style={{
            marginBottom: 16, padding: 14,
            background:'#fff0f0', borderRadius: 8,
            border: '1px solid #ffb3b3',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e05c5c', marginBottom: 8 }}>
               Hủy đơn sẽ thông báo cho khách hàng. Vui lòng nhập lý do rõ ràng.
            </p>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Lý do hủy <span style={{ color: '#e05c5c'}}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="VD: Khách sạn không đủ điều kiện phục vụ, vi phạm quy định..."value={lyDo}
              onChange={e => setLyDo(e.target.value)}
              style={{
                width:'100%', padding: '9px 12px',
                border: '1px solid #ffb3b3', borderRadius: 8,
                fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end'}}>
              <button className="btn btn-ghost btn-sm"onClick={() => { setCancelMode(false); setLyDo(''); }}>
                Hủy bỏ
              </button>
              <button
                className="btn btn-danger btn-sm"disabled={loading}
                onClick={() => {
                  if (!lyDo.trim()) return alert('Nhập lý do hủy');
                  onCancel(lyDo);
                }}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        )}

        {/* Nội dung */}
        <div className="form-grid"style={{ marginBottom: 16 }}>

          {/* Thông tin đặt phòng */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em'}}>
               Thông tin phòng
            </h4>
            <InfoRow label="Khách sạn"value={booking.loai_phong?.khach_san?.ten} />
            <InfoRow label="Đối tác"value={booking.loai_phong?.khach_san?.doi_tac?.ten_cong_ty} />
            <InfoRow label="Loại phòng"value={booking.loai_phong?.ten_loai} />
            <InfoRow label="Địa chỉ"value={booking.loai_phong?.khach_san?.dia_chi} />
            <InfoRow label="Nhận phòng"value={formatDate(booking.ngay_nhan_phong)} />
            <InfoRow label="Trả phòng"value={formatDate(booking.ngay_tra_phong)} />
            <InfoRow label="Số đêm"value={`${nights} đêm`} />
            <InfoRow label="Số khách"value={`${booking.so_khach} khách`} />
          </div>

          {/* Thông tin khách */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color:'#3C7363', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em'}}>
               Thông tin khách
            </h4>
            <InfoRow label="Khách hàng"value={booking.khach_hang?.ho_ten} />
            <InfoRow label="Email"value={booking.khach_hang?.nguoi_dung?.email} />
            <InfoRow label="SĐT"value={booking.khach_hang?.nguoi_dung?.so_dien_thoai} />
            <InfoRow label="Người nhận phòng"value={booking.ten_nguoi_nhan} />
            <InfoRow label="SĐT người nhận"value={booking.sdt_nguoi_nhan} />
            <InfoRow label="Tổng lượt đặt"value={`${booking.khach_hang?.tong_lan_dat || 0} lần`} />
            <InfoRow label="Tổng chi tiêu"value={formatCurrency(booking.khach_hang?.tong_tien_da_chi)} />
            {booking.ghi_chu && (
              <InfoRow label="Ghi chú"value={booking.ghi_chu} />
            )}
          </div>
        </div>

        {/* Thanh toán */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color:'#3C7363', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em'}}>
             Thanh toán
          </h4>
          <div style={{
            background:'#f8fdfb', borderRadius: 10,
            border: '1px solid #d4ede6', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: '#5a7a72'}}>Tổng tiền gốc</span>
              <span>{formatCurrency(booking.tong_tien_goc)}</span>
            </div>
            {Number(booking.tien_giam) > 0 && (
              <div style={{ display:'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                <span style={{ color: '#5a7a72'}}>
                  Giảm giá {booking.khuyen_mai ? `(${booking.khuyen_mai.ma_code})` :''}
                </span>
                <span style={{ color: '#e05c5c'}}>- {formatCurrency(booking.tien_giam)}</span>
              </div>
            )}
            <div style={{
              display:'flex', justifyContent: 'space-between',
              paddingTop: 10, borderTop: '0.5px solid #d4ede6',
              fontWeight: 700, fontSize: 17,
            }}>
              <span>Thành tiền</span>
              <span style={{ color: '#3C7363'}}>{formatCurrency(booking.thanh_toan_cuoi)}</span>
            </div>
            <div style={{ marginTop: 10, display:'flex', gap: 16, fontSize: 13, color: '#5a7a72'}}>
              <span>Phương thức: {PHUONG_THUC[booking.phuong_thuc_tt] || booking.phuong_thuc_tt}</span>
              {booking.thanh_toan && (
                <span>
                  Thanh toán:{' '}
                  <span className={`badge ${booking.thanh_toan.trang_thai === 'thanh_cong'?'badge-success':'badge-warning'}`} style={{ fontSize: 11 }}>
                    {booking.thanh_toan.trang_thai === 'thanh_cong'?'Đã thanh toán':'Chờ thanh toán'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chi tiết từng đêm */}
        {booking.chi_tiet_dat_phong?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em'}}>
               Chi tiết giá từng đêm
            </h4>
            <div style={{ maxHeight: 200, overflowY:'auto'}}>
              <table className="data-table"style={{ minWidth:'auto'}}>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Giá/đêm</th>
                    <th>Loại giá</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.chi_tiet_dat_phong.map(ct => (
                    <tr key={ct.ma_chi_tiet}>
                      <td>{formatDate(ct.ngay)}</td>
                      <td style={{ fontWeight: 500 }}>{formatCurrency(ct.don_gia)}</td>
                      <td>
                        <span className={`badge ${
                          ct.loai_gia ==='co_ban'?'badge-default':
                          ct.loai_gia ==='cuoi_tuan'?'badge-warning':
                          ct.loai_gia ==='le_tet'?'badge-danger':'badge-info'}`} style={{ fontSize: 11 }}>
                          {ct.loai_gia ==='co_ban'?'Cơ bản':
                           ct.loai_gia ==='cuoi_tuan'?'Cuối tuần':
                           ct.loai_gia ==='le_tet'?'Lễ tết':'Cao điểm'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lịch sử thông báo = lịch sử thay đổi */}
        {booking.thong_bao?.length > 0 && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em'}}>
               Lịch sử thay đổi
            </h4>
            <div style={{
              border:'0.5px solid #d4ede6', borderRadius: 8, overflow: 'hidden',
            }}>
              {booking.thong_bao.map((tb, i) => (
                <div
                  key={tb.ma_thong_bao}
                  style={{
                    display: 'flex', gap: 12, padding: '10px 14px',
                    borderBottom: i < booking.thong_bao.length - 1 ? '0.5px solid #f0f0f0':'none',
                    background: i % 2 === 0 ? '#fff':'#f8fdfb',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#3C7363', flexShrink: 0, marginTop: 5,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2e28'}}>{tb.tieu_de}</div>
                    <div style={{ fontSize: 12, color:'#5a7a72', marginTop: 2 }}>{tb.noi_dung}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#5a7a72', flexShrink: 0, marginTop: 2 }}>
                    {formatDateTime(tb.ngay_gui)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const AdminBookingsPage = () => {
  const dispatch = useDispatch();
  const { list, detail, stats, hotels, loading, detailLoading, error, successMsg } = useSelector(
    s => s.adminBooking || {}
  );

  // Filters
  const [keyword,      setKeyword]      = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter,  setHotelFilter]  = useState('all');
  const [tuNgay,       setTuNgay]       = useState('');
  const [denNgay,      setDenNgay]      = useState('');
  const [showDetail,   setShowDetail]   = useState(false);

  useEffect(() => {
    dispatch(fetchBookingStats());
    dispatch(fetchHotelsForFilter());
    dispatch(fetchAdminBookings());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error]);

  const handleSearch = () => {
    dispatch(fetchAdminBookings({
      keyword, trang_thai: statusFilter,
      ks_id: hotelFilter !== 'all'? hotelFilter :'',
      tu_ngay: tuNgay, den_ngay: denNgay,
    }));
  };

  const handleReset = () => {
    setKeyword(''); setStatusFilter('all');
    setHotelFilter('all'); setTuNgay(''); setDenNgay('');
    dispatch(fetchAdminBookings());
  };

  const handleViewDetail = (id) => {
    dispatch(fetchAdminBookingDetail(id));
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    dispatch(clearDetail());
  };

  const handleCancel = async (lyDo) => {
    if (!detail) return;
    await dispatch(cancelAdminBooking({ id: detail.ma_dat_phong, ly_do: lyDo }));
    handleCloseDetail();
    dispatch(fetchBookingStats());
  };

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats?.total ?? list.length },
    { id: 'cho_xac_nhan', label: 'Chờ xác nhận', count: stats?.cho_xac_nhan ?? 0 },
    { id: 'da_xac_nhan', label: 'Đã xác nhận', count: stats?.da_xac_nhan ?? 0 },
    { id: 'hoan_thanh', label: 'Hoàn thành', count: stats?.hoan_thanh ?? 0 },
    { id: 'da_huy', label: 'Đã hủy', count: stats?.da_huy ?? 0 },
  ], [stats, list.length]);

  const handleTabChange = (tab) => {
    setStatusFilter(tab);
    dispatch(fetchAdminBookings({
      keyword,
      trang_thai: tab,
      ks_id: hotelFilter !== 'all' ? hotelFilter : '',
      tu_ngay: tuNgay,
      den_ngay: denNgay,
    }));
  };

  const inputSt = {
    padding: '9px 12px', border: '1px solid #d4ede6',
    borderRadius: 8, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: '#fff',
  };

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Đặt phòng"
        subtitle="Xem và can thiệp tất cả đơn đặt phòng trong hệ thống"
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
      )}

      {stats && (
        <SummaryStats
          items={[
            { label: 'Tổng đơn', value: stats.total, color: '#1a2e28' },
            { label: 'Chờ xác nhận', value: stats.cho_xac_nhan, color: '#b36b00' },
            { label: 'Đã xác nhận', value: stats.da_xac_nhan, color: '#0958d9' },
            { label: 'Hoàn thành', value: stats.hoan_thanh, color: '#1a7a4a' },
          ]}
        />
      )}

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Mã đơn, tên khách, SĐT..."
        />
        <select
          className="mgmt-select-inline"
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
        >
          <option value="all">Tất cả khách sạn</option>
          {hotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
        <input
          type="date"
          className="mgmt-select-inline"
          value={tuNgay}
          onChange={(e) => setTuNgay(e.target.value)}
          title="Từ ngày"
        />
        <input
          type="date"
          className="mgmt-select-inline"
          value={denNgay}
          min={tuNgay}
          onChange={(e) => setDenNgay(e.target.value)}
          title="Đến ngày"
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={handleSearch}>Tìm kiếm</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleReset}>Reset</button>
      </div>

      <FilterTabs tabs={filterTabs} active={statusFilter} onChange={handleTabChange} />

      <div className="mgmt-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
        ) : list.length === 0 ? (
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
                <col style={{ width: 72 }} />
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
                {list.map((b) => {
                  const st = TRANG_THAI[b.trang_thai] || { label: b.trang_thai, cls: 'badge-default' };
                  return (
                    <tr key={b.ma_dat_phong}>
                      <td style={{ fontWeight: 500, color: '#3C7363' }}>#{b.ma_don_hang}</td>
                      <td>
                        <div className="mgmt-cell-name">{b.ten_nguoi_nhan}</div>
                        <div className="mgmt-cell-sub">{b.khach_hang?.ho_ten}</div>
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
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showDetail && (
        detailLoading ? (
          <div className="modal-overlay">
            <div className="modal-box" style={{ textAlign: 'center', padding: 40 }}>
               Đang tải...
            </div>
          </div>
        ) : (
          <BookingDetailModal
            booking={detail}
            onClose={handleCloseDetail}
            onCancel={handleCancel}
            loading={loading}
          />
        )
      )}
    </div>
  );
};

export default AdminBookingsPage;