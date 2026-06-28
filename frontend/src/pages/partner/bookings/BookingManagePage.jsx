import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchPartnerBookings,
  clearMsg,
} from '../../../store/slices/partnerBookingSlice';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import BookingTable from '../../../components/booking/BookingTable';

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

  const filtered = list.filter((b) => {
    let matchStatus = statusFilter === 'all' || b.trang_thai === statusFilter;
    if (statusFilter === 'da_xac_nhan') {
      matchStatus = ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai);
    }
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

  const countByStatus = (s) => {
    if (s === 'da_xac_nhan') {
      return list.filter((b) => ['da_xac_nhan', 'cho_xac_nhan'].includes(b.trang_thai)).length;
    }
    return list.filter((b) => b.trang_thai === s).length;
  };

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: list.length },
    { id: 'da_xac_nhan', label: 'Chờ check-in', count: countByStatus('da_xac_nhan') },
    { id: 'da_checkin', label: 'Đã check-in', count: countByStatus('da_checkin') },
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

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm mã đơn, tên khách, SĐT..."
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
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
                bookings={filtered}
                onViewDetail={handleViewDetail}
              />
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagePage;
