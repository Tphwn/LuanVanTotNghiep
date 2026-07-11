import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchAdminBookings,
  fetchBookingStats,
  fetchHotelsForFilter,
  fetchPartnersForFilter,
  cancelAdminBooking,
  clearMsg,
} from '../../../store/slices/adminBookingSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import BookingTable from '../../../components/booking/BookingTable';
import BookingDetailModal from '../../../components/booking/BookingDetailModal';
import AdminBookingCancelModal from './components/AdminBookingCancelModal';

const PAGE_SIZE = 10;

const AdminBookingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeBookingId } = useParams();
  const { list, stats, hotels, partners, loading, error, successMsg } = useSelector(
    (s) => s.adminBooking || {},
  );

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [page, setPage] = useState(1);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchBookingStats());
    dispatch(fetchHotelsForFilter());
    dispatch(fetchPartnersForFilter());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    dispatch(fetchAdminBookings({
      keyword: debouncedKeyword,
      trang_thai: statusFilter,
      ma_doi_tac: partnerFilter !== 'all' ? partnerFilter : '',
      ks_id: hotelFilter !== 'all' ? hotelFilter : '',
      tu_ngay: tuNgay,
      den_ngay: denNgay,
    }));
  }, [dispatch, debouncedKeyword, statusFilter, partnerFilter, hotelFilter, tuNgay, denNgay]);

  const filteredHotels = useMemo(() => {
    if (partnerFilter === 'all') return hotels;
    return hotels.filter((h) => String(h.ma_doi_tac) === String(partnerFilter));
  }, [hotels, partnerFilter]);

  const handlePartnerChange = (value) => {
    setPartnerFilter(value);
    if (value === 'all') return;
    const hotelStillValid = hotels.some(
      (h) => String(h.ma_khach_san) === String(hotelFilter)
        && String(h.ma_doi_tac) === String(value),
    );
    if (hotelFilter !== 'all' && !hotelStillValid) {
      setHotelFilter('all');
    }
  };

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, statusFilter, partnerFilter, hotelFilter, tuNgay, denNgay]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const rangeFrom = list.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, list.length);

  const listFilters = useMemo(() => ({
    keyword: debouncedKeyword,
    trang_thai: statusFilter,
    ma_doi_tac: partnerFilter !== 'all' ? partnerFilter : '',
    ks_id: hotelFilter !== 'all' ? hotelFilter : '',
    tu_ngay: tuNgay,
    den_ngay: denNgay,
  }), [debouncedKeyword, statusFilter, partnerFilter, hotelFilter, tuNgay, denNgay]);

  const handleViewDetail = (id) => {
    navigate(`/admin/bookings/${id}`);
  };

  const handleCloseDetail = () => {
    navigate('/admin/bookings');
  };

  const handleDetailUpdated = () => {
    dispatch(fetchBookingStats());
    dispatch(fetchAdminBookings(listFilters));
  };

  const handleCancelRequest = (booking) => {
    setCancelBooking(booking);
  };

  const handleCloseCancelModal = () => {
    if (cancelLoading) return;
    setCancelBooking(null);
  };

  const handleConfirmCancel = async (lyDo) => {
    if (!cancelBooking) return;

    setCancelLoading(true);
    const result = await dispatch(cancelAdminBooking({
      id: cancelBooking.ma_dat_phong,
      ly_do: lyDo,
    }));
    setCancelLoading(false);

    if (cancelAdminBooking.fulfilled.match(result)) {
      setCancelBooking(null);
      dispatch(fetchBookingStats());
      dispatch(fetchAdminBookings(listFilters));
    }
  };

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats?.total ?? list.length, tone: 'neutral' },
    { id: 'da_xac_nhan', label: 'Chờ check-in', count: stats?.da_xac_nhan ?? 0, tone: 'info' },
    { id: 'da_checkin', label: 'Đã check-in', count: stats?.da_checkin ?? 0, tone: 'info' },
    { id: 'hoan_thanh', label: 'Hoàn thành', count: stats?.hoan_thanh ?? 0, tone: 'success' },
    { id: 'da_huy', label: 'Đã hủy', count: stats?.da_huy ?? 0, tone: 'danger' },
  ], [stats, list.length]);

  const hasActiveFilter = Boolean(
    keyword.trim()
    || statusFilter !== 'all'
    || partnerFilter !== 'all'
    || hotelFilter !== 'all'
    || tuNgay
    || denNgay,
  );

  const clearFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setPartnerFilter('all');
    setHotelFilter('all');
    setTuNgay('');
    setDenNgay('');
  };

  return (
    <div className="mgmt-page mgmt-list-page admin-bookings-page">
      <ManagementHeader
        title="Quản Lý Đặt Phòng"
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
      )}

      <AdminBookingCancelModal
        booking={cancelBooking}
        loading={cancelLoading}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancel}
      />

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm mã đơn, tên khách, SĐT..."
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      >
        <select
          className="mgmt-select-inline"
          value={partnerFilter}
          onChange={(e) => handlePartnerChange(e.target.value)}
          aria-label="Lọc theo đối tác"
        >
          <option value="all">Tất cả đối tác</option>
          {partners.map((p) => (
            <option key={p.ma_doi_tac} value={p.ma_doi_tac}>{p.ten_cong_ty}</option>
          ))}
        </select>
        <select
          className="mgmt-select-inline"
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
          aria-label="Lọc theo khách sạn"
        >
          <option value="all">Tất cả khách sạn</option>
          {filteredHotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
      </ManagementToolbar>

      <div className="mgmt-toolbar-row admin-bookings-date-row">
        <span className="mgmt-toolbar-label">Ngày check-in</span>
        <input
          type="date"
          className="mgmt-select-inline admin-bookings-date-filter"
          value={tuNgay}
          onChange={(e) => setTuNgay(e.target.value)}
          aria-label="Ngày nhận"
        />
        <span className="mgmt-toolbar-label">Ngày check-out</span>
        <input
          type="date"
          className="mgmt-select-inline admin-bookings-date-filter"
          value={denNgay}
          min={tuNgay}
          onChange={(e) => setDenNgay(e.target.value)}
          aria-label="Ngày trả"
        />
        <span className="mgmt-toolbar-clear-slot">
          {hasActiveFilter && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </span>
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đơn đặt phòng nào</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
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
                    <th style={{ width: 96 }}>Thao tác</th>
                  </tr>
                </thead>
                <BookingTable
                  bookings={pagedBookings}
                  onViewDetail={handleViewDetail}
                  onCancelBooking={handleCancelRequest}
                />
              </table>
            </div>

            {list.length > PAGE_SIZE && (
              <div className="mgmt-list-pagination">
                <span className="mgmt-list-pagination-info">
                  Hiển thị {rangeFrom}–{rangeTo} / {list.length}
                </span>
                <div className="mgmt-list-pagination-controls">
                  <button
                    type="button"
                    className="mgmt-page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`mgmt-page-btn${num === currentPage ? ' is-active' : ''}`}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mgmt-page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BookingDetailModal
        isOpen={Boolean(routeBookingId)}
        bookingId={routeBookingId}
        role="admin"
        onClose={handleCloseDetail}
        onUpdated={handleDetailUpdated}
        listFilters={listFilters}
      />
    </div>
  );
};

export default AdminBookingsPage;
