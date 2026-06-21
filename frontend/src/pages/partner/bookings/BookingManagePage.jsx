import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchPartnerBookings,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';
import BookingTable from './components/BookingTable';

const BookingManagePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    list = [],
    loading = false,
    error = null,
    successMsg = null,
  } = useSelector((state) => state.partnerBooking || {});

  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');

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

  const handleConfirmBooking = async (id) => {
    navigate(`/partner/bookings/${id}`);
  };

  const filtered = list.filter((b) => {
    let matchStatus = statusFilter === 'all' || b.trang_thai === statusFilter;
    if (statusFilter === 'da_huy') {
      matchStatus = ['da_huy', 'tu_choi'].includes(b.trang_thai);
    }
    const text = keyword.toLowerCase();
    const matchKeyword = !keyword
      || b.ma_don_hang?.toLowerCase().includes(text)
      || b.ten_nguoi_nhan?.toLowerCase().includes(text)
      || b.sdt_nguoi_nhan?.includes(text)
      || b.khach_hang?.ho_ten?.toLowerCase().includes(text);
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
        title="Quản Lý Đặt phòng"
        subtitle="Xem và xử lý các đơn đặt phòng của khách sạn"
      />

      {successMsg && <div className="mgmt-toast success">{successMsg}</div>}
      {error && <div className="mgmt-toast error">{error}</div>}

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
              <BookingTable
                bookings={filtered}
                onViewDetail={handleViewDetail}
                onConfirmBooking={handleConfirmBooking}
              />
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagePage;
