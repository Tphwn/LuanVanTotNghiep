import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminBookings,
  fetchBookingStats,
  fetchHotelsForFilter,
  clearMsg,
} from '../../../store/slices/adminBookingSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import BookingTable from '../../../components/booking/BookingTable';

const AdminBookingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, stats, hotels, loading, error, successMsg } = useSelector(
    (s) => s.adminBooking || {},
  );

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  useEffect(() => {
    dispatch(fetchBookingStats());
    dispatch(fetchHotelsForFilter());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchAdminBookings({
      keyword: debouncedKeyword,
      trang_thai: statusFilter,
      ks_id: hotelFilter !== 'all' ? hotelFilter : '',
      tu_ngay: tuNgay,
      den_ngay: denNgay,
    }));
  }, [dispatch, debouncedKeyword, statusFilter, hotelFilter, tuNgay, denNgay]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  const handleViewDetail = (id) => {
    navigate(`/admin/bookings/${id}`);
  };

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats?.total ?? list.length },
    { id: 'da_xac_nhan', label: 'Chờ check-in', count: stats?.da_xac_nhan ?? 0 },
    { id: 'da_checkin', label: 'Đã check-in', count: stats?.da_checkin ?? 0 },
    { id: 'hoan_thanh', label: 'Hoàn thành', count: stats?.hoan_thanh ?? 0 },
    { id: 'da_huy', label: 'Đã hủy', count: stats?.da_huy ?? 0 },
  ], [stats, list.length]);

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản Lý Đặt Phòng"
        subtitle="Tất cả đơn đặt phòng trên hệ thống"
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
      )}

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm mã đơn, tên khách, SĐT..."
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      <div className="mgmt-toolbar mgmt-toolbar--filters">
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label">Khách sạn</label>
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
        </div>
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label">Ngày nhận</label>
          <input
            type="date"
            className="mgmt-select-inline"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
          />
        </div>
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label">Ngày trả</label>
          <input
            type="date"
            className="mgmt-select-inline"
            value={denNgay}
            min={tuNgay}
            onChange={(e) => setDenNgay(e.target.value)}
          />
        </div>
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đơn đặt phòng nào</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Khách sạn</th>
                  <th>Loại phòng</th>
                  <th style={{ width: 108 }}>Check-in</th>
                  <th style={{ width: 108 }}>Check-out</th>
                  <th style={{ width: 120 }}>Tổng tiền</th>
                  <th style={{ width: 100 }}>Thanh toán</th>
                  <th style={{ width: 120 }}>Trạng thái</th>
                  <th style={{ width: 72 }}>Thao tác</th>
                </tr>
              </thead>
              <BookingTable
                bookings={list}
                onViewDetail={handleViewDetail}
              />
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
