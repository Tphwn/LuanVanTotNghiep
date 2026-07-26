import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';
import FilterActions from '../../../components/common/management/FilterActions';
import BookingTable from '../../../components/booking/BookingTable';
import BookingDetailModal from '../../../components/booking/BookingDetailModal';
import AdminBookingCancelModal from './components/AdminBookingCancelModal';
import { buildAdminBookingsListPath } from '../../../utils/adminListReturn';
import { getPaymentDisplay } from '../../../utils/bookingDisplay';

const PAGE_SIZE = 10;
const VALID_STATUS_TABS = ['all', 'da_xac_nhan', 'da_checkin', 'hoan_thanh', 'da_huy'];

const getPaymentFilterKey = (booking) => {
  const pay = getPaymentDisplay(booking);
  switch (pay.shortLabel) {
    case 'Đã thanh toán':
      return 'da_thanh_toan';
    case 'Tại KS':
      return 'tai_khach_san';
    case 'Chờ TT':
      return 'cho_thanh_toan';
    case 'Đã hoàn':
      return 'da_hoan';
    case 'Chờ xử lý':
      return 'cho_xu_ly';
    case 'Không hoàn':
      return 'khong_hoan';
    default:
      return 'khac';
  }
};

const AdminBookingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeBookingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list, stats, hotels, partners, loading, error, successMsg } = useSelector(
    (s) => s.adminBooking || {},
  );

  const tabFromUrl = searchParams.get('tab');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    VALID_STATUS_TABS.includes(tabFromUrl) ? tabFromUrl : 'all'
  );
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  const [page, setPage] = useState(1);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchBookingStats());
    dispatch(fetchHotelsForFilter());
    dispatch(fetchPartnersForFilter());
  }, [dispatch]);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'all';
    if (VALID_STATUS_TABS.includes(tab) && tab !== statusFilter) {
      setStatusFilter(tab);
    }
  }, [searchParams, statusFilter]);

  useEffect(() => {
    dispatch(fetchAdminBookings({
      keyword,
      trang_thai: statusFilter,
      ma_doi_tac: partnerFilter !== 'all' ? partnerFilter : '',
      ks_id: hotelFilter !== 'all' ? hotelFilter : '',
      tu_ngay: checkInDate,
      den_ngay: checkOutDate,
    }));
  }, [dispatch, keyword, statusFilter, partnerFilter, hotelFilter, checkInDate, checkOutDate]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter, partnerFilter, hotelFilter, paymentFilter, checkInDate, checkOutDate]);

  const handleStatusTabChange = (tab) => {
    setStatusFilter(tab);
    if (tab === 'all') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

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

  const handleCheckInDateChange = (value) => {
    setCheckInDate(value);
    if (checkOutDate && value && checkOutDate < value) {
      setCheckOutDate(value);
    }
  };

  const displayList = useMemo(() => {
    if (paymentFilter === 'all') return list;
    return list.filter((booking) => getPaymentFilterKey(booking) === paymentFilter);
  }, [list, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return displayList.slice(start, start + PAGE_SIZE);
  }, [displayList, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const rangeFrom = displayList.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, displayList.length);

  const listFilters = useMemo(() => ({
    keyword,
    trang_thai: statusFilter,
    ma_doi_tac: partnerFilter !== 'all' ? partnerFilter : '',
    ks_id: hotelFilter !== 'all' ? hotelFilter : '',
    tu_ngay: checkInDate,
    den_ngay: checkOutDate,
  }), [keyword, statusFilter, partnerFilter, hotelFilter, checkInDate, checkOutDate]);

  const handleViewDetail = (id) => {
    navigate(`/admin/bookings/${id}`, {
      state: { returnTo: buildAdminBookingsListPath(statusFilter) },
    });
  };

  const handleCloseDetail = () => {
    navigate(buildAdminBookingsListPath(statusFilter));
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

  const summaryTabs = useMemo(() => [
    {
      id: 'all',
      label: 'Tổng đơn đặt',
      count: stats?.total ?? 0,
      tone: 'neutral',
    },
    {
      id: 'hoan_thanh',
      label: 'Hoàn thành',
      count: stats?.hoan_thanh ?? 0,
      tone: 'success',
    },
    {
      id: 'da_huy',
      label: 'Đã hủy',
      count: stats?.da_huy ?? 0,
      tone: 'danger',
    },
  ], [stats]);

  const summaryActiveTab = ['all', 'hoan_thanh', 'da_huy'].includes(statusFilter)
    ? statusFilter
    : null;

  const clearFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setPartnerFilter('all');
    setHotelFilter('all');
    setPaymentFilter('all');
    setCheckInDate('');
    setCheckOutDate('');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="mgmt-page mgmt-list-page admin-bookings-page">
      <ManagementHeader title="Quản Lý Đặt Phòng" />

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

      <div className="mgmt-toolbar-block admin-bookings-toolbar">
        <FilterTabs
          tabs={summaryTabs}
          active={summaryActiveTab}
          onChange={handleStatusTabChange}
        />

        <div className="admin-bookings-filters">
          <div className="admin-bookings-filters-row admin-bookings-filters-row--primary">
            <div className="admin-bookings-search">
              <SearchBar
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm mã đơn, tên khách, SĐT..."
              />
            </div>

            <label className="admin-bookings-date-field">
              <span>Check-in</span>
              <input
                type="date"
                className="mgmt-select-inline"
                value={checkInDate}
                onChange={(e) => handleCheckInDateChange(e.target.value)}
                aria-label="Lọc theo ngày check-in"
              />
            </label>

            <label className="admin-bookings-date-field">
              <span>Check-out</span>
              <input
                type="date"
                className="mgmt-select-inline"
                value={checkOutDate}
                min={checkInDate || undefined}
                onChange={(e) => setCheckOutDate(e.target.value)}
                aria-label="Lọc theo ngày check-out"
              />
            </label>
          </div>

          <div className="admin-bookings-filters-row admin-bookings-filters-row--secondary">
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

            <select
              className="mgmt-select-inline"
              value={statusFilter}
              onChange={(e) => handleStatusTabChange(e.target.value)}
              aria-label="Lọc theo trạng thái đơn"
            >
              <option value="all">Tất cả trạng thái đơn</option>
              <option value="da_xac_nhan">Chờ check-in</option>
              <option value="da_checkin">Đã check-in</option>
              <option value="hoan_thanh">Hoàn thành</option>
              <option value="da_huy">Đã hủy</option>
            </select>

            <select
              className="mgmt-select-inline"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              aria-label="Lọc theo trạng thái thanh toán"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="da_thanh_toan">Đã thanh toán</option>
              <option value="cho_thanh_toan">Chờ thanh toán</option>
              <option value="tai_khach_san">Thanh toán tại KS</option>
              <option value="cho_xu_ly">Chờ xử lý hoàn</option>
              <option value="da_hoan">Đã hoàn</option>
              <option value="khong_hoan">Không hoàn</option>
            </select>

            <FilterActions showApply={false} onClear={clearFilters} />
          </div>
        </div>
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : displayList.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đơn đặt phòng nào</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th className="partner-col-code">Mã đơn</th>
                    <th className="partner-col-customer">Khách hàng</th>
                    <th className="partner-col-hotel">Khách sạn</th>
                    <th className="partner-col-date">Check-in</th>
                    <th className="partner-col-date">Check-out</th>
                    <th className="partner-col-money">Tổng tiền</th>
                    <th className="partner-col-pay">Thanh toán</th>
                    <th className="partner-col-status">Trạng thái</th>
                    <th className="partner-col-actions">Thao tác</th>
                  </tr>
                </thead>
                <BookingTable
                  bookings={pagedBookings}
                  onViewDetail={handleViewDetail}
                  onCancelBooking={handleCancelRequest}
                  showRoomType={false}
                />
              </table>
            </div>

            {displayList.length > PAGE_SIZE && (
              <div className="mgmt-list-pagination">
                <span className="mgmt-list-pagination-info">
                  Hiển thị {rangeFrom}–{rangeTo} / {displayList.length}
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
