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
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';
import BookingTable from './components/BookingTable';

const AdminBookingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, stats, hotels, loading, error, successMsg } = useSelector(
    (s) => s.adminBooking || {},
  );

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

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
  }, [successMsg, error, dispatch]);

  const handleSearch = () => {
    dispatch(fetchAdminBookings({
      keyword,
      trang_thai: statusFilter,
      ks_id: hotelFilter !== 'all' ? hotelFilter : '',
      tu_ngay: tuNgay,
      den_ngay: denNgay,
    }));
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('all');
    setHotelFilter('all');
    setTuNgay('');
    setDenNgay('');
    dispatch(fetchAdminBookings());
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/bookings/${id}`);
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

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Đặt phòng"
        subtitle="Tất cả đơn đặt phòng đã đặt"
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
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
