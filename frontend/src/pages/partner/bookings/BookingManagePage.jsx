import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchPartnerBookings,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import FilterTabs from '../../../components/common/management/FilterTabs';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterActions from '../../../components/common/management/FilterActions';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import BookingTable from '../../../components/booking/BookingTable';
import BookingDetailModal from '../../../components/booking/BookingDetailModal';
import { getPaymentDisplay } from '../../../utils/bookingDisplay';

const toDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getLocalToday = () => toDateKey(new Date());

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

const matchesStatusFilter = (booking, statusFilter) => {
  if (statusFilter === 'all') return true;
  if (statusFilter === 'da_xac_nhan') {
    return ['da_xac_nhan', 'cho_xac_nhan'].includes(booking.trang_thai);
  }
  if (statusFilter === 'da_huy') {
    return ['da_huy', 'tu_choi'].includes(booking.trang_thai);
  }
  return booking.trang_thai === statusFilter;
};

const BookingManagePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeBookingId } = useParams();
  const {
    list = [],
    loading = false,
    error = null,
    successMsg = null,
  } = useSelector((state) => state.partnerBooking || {});

  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [quickAction, setQuickAction] = useState(null);

  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [draftPaymentFilter, setDraftPaymentFilter] = useState('all');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftHotelFilter, setDraftHotelFilter] = useState('all');
  const [draftCheckInDate, setDraftCheckInDate] = useState('');
  const [draftCheckOutDate, setDraftCheckOutDate] = useState('');
  const [draftQuickAction, setDraftQuickAction] = useState(null);

  useEffect(() => {
    dispatch(fetchPartnerBookings());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  const handleViewDetail = (id) => {
    navigate(`/partner/bookings/${id}`);
  };

  const handleCloseDetail = () => {
    navigate('/partner/bookings');
  };

  const handleDetailUpdated = () => {
    dispatch(fetchPartnerBookings());
  };

  const hotelOptions = useMemo(() => {
    const map = new Map();
    list.forEach((booking) => {
      const hotel = booking.loai_phong?.khach_san;
      if (hotel?.ma_khach_san) {
        map.set(hotel.ma_khach_san, hotel.ten);
      }
    });
    return Array.from(map, ([ma_khach_san, ten]) => ({ ma_khach_san, ten }))
      .sort((a, b) => (a.ten || '').localeCompare(b.ten || '', 'vi'));
  }, [list]);

  const handleHotelFilterChange = (value) => {
    setDraftHotelFilter(value);
    setDraftQuickAction(null);
  };

  const handleStatusChange = (value) => {
    setDraftStatusFilter(value);
    setDraftQuickAction(null);
  };

  const handleTabChange = (value) => {
    setStatusFilter(value);
    setDraftStatusFilter(value);
    setQuickAction(null);
    setDraftQuickAction(null);
  };

  const handlePaymentChange = (value) => {
    setDraftPaymentFilter(value);
    setDraftQuickAction(null);
  };

  const handleCheckInDateChange = (value) => {
    setDraftCheckInDate(value);
    setDraftQuickAction(null);
  };

  const handleCheckOutDateChange = (value) => {
    setDraftCheckOutDate(value);
    setDraftQuickAction(null);
  };

  const clearDraftFilters = () => {
    setDraftKeyword('');
    setDraftStatusFilter('all');
    setDraftPaymentFilter('all');
    setDraftHotelFilter('all');
    setDraftCheckInDate('');
    setDraftCheckOutDate('');
    setDraftQuickAction(null);
  };

  const clearFilters = () => {
    clearDraftFilters();
    setKeyword('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setHotelFilter('all');
    setCheckInDate('');
    setCheckOutDate('');
    setQuickAction(null);
  };

  const applyFilters = () => {
    setKeyword(draftKeyword);
    setStatusFilter(draftStatusFilter);
    setPaymentFilter(draftPaymentFilter);
    setHotelFilter(draftHotelFilter);
    setCheckInDate(draftCheckInDate);
    setCheckOutDate(draftCheckOutDate);
    setQuickAction(draftQuickAction);
  };

  const handleQuickFilterChange = (value) => {
    if (!value || value === 'all') {
      clearDraftFilters();
      return;
    }

    const todayKey = getLocalToday();
    setDraftKeyword('');
    setDraftHotelFilter('all');
    setDraftPaymentFilter('all');
    setDraftQuickAction(value);

    if (value === 'checkin_today') {
      setDraftStatusFilter('da_xac_nhan');
      setDraftCheckInDate(todayKey);
      setDraftCheckOutDate('');
      return;
    }
    if (value === 'checkout_today') {
      setDraftStatusFilter('da_checkin');
      setDraftCheckInDate('');
      setDraftCheckOutDate(todayKey);
      return;
    }
    if (value === 'staying') {
      setDraftStatusFilter('da_checkin');
      setDraftCheckInDate('');
      setDraftCheckOutDate('');
    }
  };

  const filtered = list.filter((b) => {
    const matchStatus = matchesStatusFilter(b, statusFilter);
    const matchPayment = paymentFilter === 'all' || getPaymentFilterKey(b) === paymentFilter;
    const text = keyword.toLowerCase();
    const matchKeyword = !keyword
      || b.ma_don_hang?.toLowerCase().includes(text)
      || b.ten_nguoi_nhan?.toLowerCase().includes(text)
      || b.sdt_nguoi_nhan?.includes(text)
      || b.khach_hang?.ho_ten?.toLowerCase().includes(text);
    const matchHotel = hotelFilter === 'all'
      || String(b.loai_phong?.khach_san?.ma_khach_san) === hotelFilter;
    const matchCheckIn = !checkInDate || toDateKey(b.ngay_nhan_phong) === checkInDate;
    const matchCheckOut = !checkOutDate || toDateKey(b.ngay_tra_phong) === checkOutDate;

    return matchStatus && matchPayment && matchKeyword && matchHotel && matchCheckIn && matchCheckOut;
  });

  const filterTabs = useMemo(() => {
    const count = (s) => list.filter((b) => matchesStatusFilter(b, s)).length;
    return [
      { id: 'all', label: 'Tất cả đơn', count: list.length, tone: 'neutral' },
      { id: 'da_xac_nhan', label: 'Chờ nhận phòng', count: count('da_xac_nhan'), tone: 'info' },
      { id: 'da_checkin', label: 'Đang lưu trú', count: count('da_checkin'), tone: 'info' },
      { id: 'hoan_thanh', label: 'Đã hoàn thành', count: count('hoan_thanh'), tone: 'success' },
      { id: 'da_huy', label: 'Đã hủy', count: count('da_huy'), tone: 'danger' },
    ];
  }, [list]);

  const {
    pagedItems: pagedBookings,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(filtered, 10, [
    keyword,
    statusFilter,
    paymentFilter,
    hotelFilter,
    checkInDate,
    checkOutDate,
    quickAction,
  ]);

  return (
    <div className="mgmt-page mgmt-list-page partner-bookings-page">
      <ManagementHeader
        title="Quản Lý Đặt phòng"
        subtitle="Xem và xử lý các đơn đặt phòng của khách sạn"
      />

      {successMsg && <div className="mgmt-toast success">{successMsg}</div>}
      {error && <div className="mgmt-toast error">{error}</div>}

      <div className="mgmt-toolbar-block partner-bookings-toolbar">
        <FilterTabs
          tabs={filterTabs}
          active={statusFilter}
          onChange={handleTabChange}
        />

        <div className="partner-bookings-filters">
          <div className="partner-bookings-filters-row">
            <div className="partner-bookings-search">
              <SearchBar
                value={draftKeyword}
                onChange={(e) => {
                  setDraftKeyword(e.target.value);
                  setDraftQuickAction(null);
                }}
                placeholder="Tìm mã đơn, tên khách, SĐT..."
              />
            </div>

            <select
              className="mgmt-select-inline"
              value={draftHotelFilter}
              onChange={(e) => handleHotelFilterChange(e.target.value)}
              aria-label="Lọc theo khách sạn"
            >
              <option value="all">Tất cả khách sạn</option>
              {hotelOptions.map((hotel) => (
                <option key={hotel.ma_khach_san} value={String(hotel.ma_khach_san)}>
                  {hotel.ten}
                </option>
              ))}
            </select>

            <select
              className="mgmt-select-inline"
              value={draftQuickAction || 'all'}
              onChange={(e) => handleQuickFilterChange(e.target.value)}
              aria-label="Bộ lọc nhanh"
            >
              <option value="all">Bộ lọc nhanh</option>
              <option value="checkin_today">Hôm nay nhận phòng</option>
              <option value="checkout_today">Hôm nay trả phòng</option>
              <option value="staying">Đang lưu trú</option>
            </select>
          </div>

          <div className="partner-bookings-filters-row">
            <select
              className="mgmt-select-inline"
              value={draftStatusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Lọc theo trạng thái đơn"
            >
              <option value="all">Tất cả trạng thái đơn</option>
              <option value="da_xac_nhan">Chờ nhận phòng</option>
              <option value="da_checkin">Đang lưu trú</option>
              <option value="hoan_thanh">Đã hoàn thành</option>
              <option value="da_huy">Đã hủy</option>
            </select>

            <select
              className="mgmt-select-inline"
              value={draftPaymentFilter}
              onChange={(e) => handlePaymentChange(e.target.value)}
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

            <label className="partner-bookings-date-field">
              <span>Check-in</span>
              <input
                type="date"
                className="mgmt-select-inline"
                value={draftCheckInDate}
                onChange={(e) => handleCheckInDateChange(e.target.value)}
                aria-label="Lọc theo ngày check-in"
              />
            </label>

            <label className="partner-bookings-date-field">
              <span>Check-out</span>
              <input
                type="date"
                className="mgmt-select-inline"
                value={draftCheckOutDate}
                onChange={(e) => handleCheckOutDateChange(e.target.value)}
                aria-label="Lọc theo ngày check-out"
              />
            </label>

            <FilterActions onApply={applyFilters} onClear={clearFilters} />
          </div>
        </div>
      </div>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đơn đặt phòng nào</p>
          </div>
        ) : (
          <>
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
                  bookings={pagedBookings}
                  onViewDetail={handleViewDetail}
                />
              </table>
            </div>
            {showPagination && (
              <ListPagination
                total={filtered.length}
                currentPage={currentPage}
                totalPages={totalPages}
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                pageNumbers={pageNumbers}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <BookingDetailModal
        isOpen={Boolean(routeBookingId)}
        bookingId={routeBookingId}
        role="partner"
        onClose={handleCloseDetail}
        onUpdated={handleDetailUpdated}
      />
    </div>
  );
};

export default BookingManagePage;
