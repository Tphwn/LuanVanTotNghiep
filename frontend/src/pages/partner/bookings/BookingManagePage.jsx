import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  fetchPartnerBookings,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterActions from '../../../components/common/management/FilterActions';
import DateInput from '../../../components/common/DateInput';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import BookingTable from '../../../components/booking/BookingTable';
import BookingDetailModal from '../../../components/booking/BookingDetailModal';
import {
  getPaymentFilterKey,
  isAdminCancelledBooking,
  isCancelledBooking,
} from '../../../utils/bookingDisplay';

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

const matchesStatusFilter = (booking, statusFilter) => {
  if (statusFilter === 'all') return true;
  if (statusFilter === 'cho_nhan_phong' || statusFilter === 'da_xac_nhan') {
    return ['da_xac_nhan', 'cho_xac_nhan'].includes(booking.trang_thai);
  }
  if (statusFilter === 'huy_admin') {
    return isAdminCancelledBooking(booking);
  }
  if (statusFilter === 'da_huy') {
    return isCancelledBooking(booking) && !isAdminCancelledBooking(booking);
  }
  return booking.trang_thai === statusFilter;
};

const isActiveStay = (booking) => booking.trang_thai === 'da_checkin';

const VALID_STATUS_FROM_NOTIFY = [
  'all', 'cho_nhan_phong', 'da_xac_nhan', 'da_huy', 'huy_admin', 'da_checkin', 'hoan_thanh',
];

const BookingManagePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeBookingId } = useParams();
  const {
    list = [],
    loading = false,
    error = null,
    successMsg = null,
  } = useSelector((state) => state.partnerBooking || {});

  const initialStatus = VALID_STATUS_FROM_NOTIFY.includes(location.state?.statusFilter)
    ? location.state.statusFilter
    : 'all';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [quickAction, setQuickAction] = useState(null);
  const [assistantKey, setAssistantKey] = useState(initialStatus === 'all' ? 'all' : initialStatus);

  const todayKey = useMemo(() => getLocalToday(), []);
  const tomorrowKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateKey(d);
  }, []);

  useEffect(() => {
    dispatch(fetchPartnerBookings());
  }, [dispatch]);

  useEffect(() => {
    const next = location.state?.statusFilter;
    if (VALID_STATUS_FROM_NOTIFY.includes(next)) {
      setStatusFilter(next);
      setAssistantKey(next === 'all' ? 'all' : next);
      setQuickAction(null);
    }
  }, [location.state]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
    return undefined;
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

  const assistantStats = useMemo(() => {
    const checkinToday = list.filter((b) => toDateKey(b.ngay_nhan_phong) === todayKey).length;
    const checkoutToday = list.filter((b) => toDateKey(b.ngay_tra_phong) === todayKey).length;
    const waiting = list.filter((b) => matchesStatusFilter(b, 'cho_nhan_phong')).length;
    const staying = list.filter((b) => isActiveStay(b)).length;
    const cancelled = list.filter((b) => matchesStatusFilter(b, 'da_huy')).length;
    return { checkinToday, checkoutToday, waiting, staying, cancelled };
  }, [list, todayKey]);

  const clearFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setHotelFilter('all');
    setCheckInDate('');
    setCheckOutDate('');
    setQuickAction(null);
    setAssistantKey('all');
  };

  const applyQuickPreset = (value) => {
    if (!value || value === 'all') {
      clearFilters();
      return;
    }

    setKeyword('');
    setHotelFilter('all');
    setPaymentFilter('all');
    setQuickAction(value);
    setAssistantKey(value === 'staying' ? 'da_checkin' : 'all');

    if (value === 'staying') {
      setStatusFilter('da_checkin');
      setCheckInDate('');
      setCheckOutDate('');
      return;
    }
    if (value === 'arrive_tomorrow') {
      setStatusFilter('all');
      setCheckInDate(tomorrowKey);
      setCheckOutDate('');
      return;
    }
    if (value === 'booked_today') {
      setStatusFilter('all');
      setCheckInDate('');
      setCheckOutDate('');
    }
  };

  const handleAssistantClick = (key) => {
    if (key === 'checkin_today') {
      setKeyword('');
      setHotelFilter('all');
      setPaymentFilter('all');
      setQuickAction(null);
      setAssistantKey(key);
      setStatusFilter('all');
      setCheckInDate(todayKey);
      setCheckOutDate('');
      return;
    }
    if (key === 'checkout_today') {
      setKeyword('');
      setHotelFilter('all');
      setPaymentFilter('all');
      setQuickAction(null);
      setAssistantKey(key);
      setStatusFilter('all');
      setCheckInDate('');
      setCheckOutDate(todayKey);
      return;
    }

    setQuickAction(null);
    setCheckInDate('');
    setCheckOutDate('');
    setPaymentFilter('all');
    setAssistantKey(key);

    if (key === 'cho_nhan_phong') {
      setStatusFilter('cho_nhan_phong');
      return;
    }
    if (key === 'da_checkin') {
      setStatusFilter('da_checkin');
      return;
    }
    if (key === 'da_huy') {
      setStatusFilter('da_huy');
      return;
    }
    setStatusFilter('all');
  };

  const handleHotelFilterChange = (value) => {
    setHotelFilter(value);
    if (quickAction && quickAction !== 'booked_today') setQuickAction(null);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setQuickAction(null);
    setAssistantKey(value === 'all' ? 'all' : value);
    if (value !== 'all') {
      setCheckInDate('');
      setCheckOutDate('');
    }
  };

  const handlePaymentChange = (value) => {
    setPaymentFilter(value);
  };

  const handleCheckInDateChange = (value) => {
    setCheckInDate(value);
    setQuickAction(null);
    setAssistantKey(value === todayKey ? 'checkin_today' : 'all');
  };

  const handleCheckOutDateChange = (value) => {
    setCheckOutDate(value);
    setQuickAction(null);
    setAssistantKey(value === todayKey ? 'checkout_today' : 'all');
  };

  const filtered = useMemo(() => {
    const rows = list.filter((b) => {
      const matchStatus = matchesStatusFilter(b, statusFilter);
      const matchPayment = paymentFilter === 'all' || getPaymentFilterKey(b) === paymentFilter;
      const text = keyword.toLowerCase();
      const matchKeyword = !keyword
        || b.ma_don_hang?.toLowerCase().includes(text)
        || b.ten_nguoi_nhan?.toLowerCase().includes(text)
        || b.sdt_nguoi_nhan?.includes(text)
        || b.khach_hang?.ho_ten?.toLowerCase().includes(text)
        || b.khach_hang?.sdt?.includes(text);
      const matchHotel = hotelFilter === 'all'
        || String(b.loai_phong?.khach_san?.ma_khach_san) === hotelFilter;
      const matchCheckIn = !checkInDate || toDateKey(b.ngay_nhan_phong) === checkInDate;
      const matchCheckOut = !checkOutDate || toDateKey(b.ngay_tra_phong) === checkOutDate;
      const matchBookedToday = quickAction !== 'booked_today'
        || toDateKey(b.ngay_dat) === todayKey;
      return matchStatus
        && matchPayment
        && matchKeyword
        && matchHotel
        && matchCheckIn
        && matchCheckOut
        && matchBookedToday;
    });

    return rows;
  }, [
    list,
    keyword,
    statusFilter,
    paymentFilter,
    hotelFilter,
    checkInDate,
    checkOutDate,
    quickAction,
    todayKey,
  ]);

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

  const todayCards = [
    {
      id: 'checkin_today',
      label: 'Check-in hôm nay',
      count: assistantStats.checkinToday,
      tone: 'warning',
      hint: 'Chuẩn bị nhận phòng',
    },
    {
      id: 'checkout_today',
      label: 'Check-out hôm nay',
      count: assistantStats.checkoutToday,
      tone: 'danger',
      hint: 'Chuẩn bị dọn phòng',
    },
  ];

  const statusCards = [
    {
      id: 'cho_nhan_phong',
      label: 'Chờ nhận phòng',
      count: assistantStats.waiting,
      tone: 'info',
    },
    {
      id: 'da_checkin',
      label: 'Đang lưu trú',
      count: assistantStats.staying,
      tone: 'success',
    },
    {
      id: 'da_huy',
      label: 'Đã hủy',
      count: assistantStats.cancelled,
      tone: 'muted',
    },
  ];

  return (
    <div className="mgmt-page mgmt-list-page partner-bookings-page">
      <ManagementHeader
        title="Quản Lý Đặt phòng"
        subtitle="Trợ lý nhắc việc cho lễ tân — ưu tiên check-in / check-out hôm nay"
      />

      {successMsg && <div className="mgmt-toast success">{successMsg}</div>}
      {error && <div className="mgmt-toast error">{error}</div>}

      <div className="mgmt-toolbar-block partner-bookings-toolbar">
        <section className="partner-booking-assistant" aria-label="Trợ lý nhắc việc">
          <div className="partner-booking-assistant-group">
            <h3 className="partner-booking-assistant-title partner-booking-assistant-title--today">
              Việc hôm nay
            </h3>
            <div className="partner-booking-assistant-cards partner-booking-assistant-cards--today">
              {todayCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`partner-booking-assistant-card partner-booking-assistant-card--${card.tone}${assistantKey === card.id ? ' is-active' : ''}`}
                  onClick={() => handleAssistantClick(card.id)}
                >
                  <span className="partner-booking-assistant-card-label">{card.label}</span>
                  <strong className="partner-booking-assistant-card-count">{card.count}</strong>
                  <span className="partner-booking-assistant-card-hint">{card.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="partner-booking-assistant-group">
            <h3 className="partner-booking-assistant-title">Trạng thái tổng</h3>
            <div className="partner-booking-assistant-cards partner-booking-assistant-cards--status">
              {statusCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`partner-booking-assistant-card partner-booking-assistant-card--${card.tone}${assistantKey === card.id ? ' is-active' : ''}`}
                  onClick={() => handleAssistantClick(card.id)}
                >
                  <span className="partner-booking-assistant-card-label">{card.label}</span>
                  <strong className="partner-booking-assistant-card-count">{card.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="partner-bookings-filters">
          <div className="partner-bookings-filters-row partner-bookings-filters-row--primary">
            <div className="partner-bookings-search">
              <SearchBar
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm mã đơn, tên khách, SĐT..."
              />
            </div>

            <label className="partner-bookings-date-field">
              <span>Check-in</span>
              <DateInput
                className="mgmt-select-inline"
                value={checkInDate}
                onChange={(e) => handleCheckInDateChange(e.target.value)}
                aria-label="Lọc theo ngày check-in"
              />
            </label>

            <label className="partner-bookings-date-field">
              <span>Check-out</span>
              <DateInput
                className="mgmt-select-inline"
                value={checkOutDate}
                onChange={(e) => handleCheckOutDateChange(e.target.value)}
                aria-label="Lọc theo ngày check-out"
              />
            </label>
          </div>

          <div className="partner-bookings-filters-row partner-bookings-filters-row--secondary">
            <select
              className="mgmt-select-inline"
              value={hotelFilter}
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
              value={quickAction || 'all'}
              onChange={(e) => applyQuickPreset(e.target.value)}
              aria-label="Bộ lọc nhanh"
            >
              <option value="all">Bộ lọc nhanh</option>
              <option value="staying">Khách đang lưu trú</option>
              <option value="arrive_tomorrow">Khách đến vào ngày mai</option>
              <option value="booked_today">Đặt phòng mới hôm nay</option>
            </select>

            <select
              className="mgmt-select-inline"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Lọc theo trạng thái đơn"
            >
              <option value="all">Tất cả trạng thái đơn</option>
              <option value="cho_nhan_phong">Chờ nhận phòng</option>
              <option value="da_checkin">Đang lưu trú</option>
              <option value="hoan_thanh">Đã hoàn thành</option>
              <option value="da_huy">Đã hủy</option>
              <option value="huy_admin">Bị hủy (admin hủy)</option>
            </select>

            <select
              className="mgmt-select-inline"
              value={paymentFilter}
              onChange={(e) => handlePaymentChange(e.target.value)}
              aria-label="Lọc theo trạng thái thanh toán"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="da_thanh_toan">Đã thanh toán</option>
              <option value="cho_thanh_toan">Chờ thanh toán</option>
              <option value="da_hoan">Đã hoàn tiền</option>
              <option value="khong_hoan">Không hoàn tiền</option>
            </select>

            <FilterActions showApply={false} onClear={clearFilters} />
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
                    <th className="partner-col-customer">Khách hàng</th>
                    <th className="partner-col-hotel">Khách sạn</th>
                    <th className="partner-col-date">Check-in</th>
                    <th className="partner-col-date">Check-out</th>
                    <th className="partner-col-money">Giá phòng gốc</th>
                    <th className="partner-col-money">Tổng khách trả</th>
                    <th className="partner-col-pay">Thanh toán</th>
                    <th className="partner-col-status">Trạng thái</th>
                    <th className="partner-col-actions">Thao tác</th>
                  </tr>
                </thead>
                <BookingTable
                  bookings={pagedBookings}
                  onViewDetail={handleViewDetail}
                  highlightToday
                  todayKey={todayKey}
                  showRoomType={false}
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
