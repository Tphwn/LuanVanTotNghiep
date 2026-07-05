import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import BackButton from '../../../components/common/BackButton';
import HotelListSection from './components/HotelListSection';
import RoomListSection from './components/RoomListSection';
import RoomDetailModal from './components/RoomDetailModal';

const isHotelActive = (hotel) => hotel.trang_thai === 'hoat_dong';

const RoomTypePage = () => {
  const { hotelId: urlHotelId } = useParams();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [hotelStats, setHotelStats] = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedHotel, setSelected] = useState(urlHotelId || '');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelNameFilter, setHotelNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [hotelStatusFilter, setHotelStatusFilter] = useState('all');
  const [detailRoom, setDetailRoom] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectHotel = (id) => {
    const val = String(id);
    setSelected(val);
    setRoomTypeFilter('');
    setStatusFilter('all');
    navigate(id ? `/partner/hotels/${id}/rooms` : '/partner/rooms');
  };

  const loadHotelStats = async (hotelList) => {
    const entries = await Promise.all(
      hotelList.map(async (h) => {
        try {
          const res = await api.get(`/partner/rooms?hotelId=${h.ma_khach_san}`);
          const list = res.data.data || [];
          return [h.ma_khach_san, {
            total: list.length,
            active: list.filter((r) => r.trang_thai === 'hoat_dong').length,
          }];
        } catch {
          return [h.ma_khach_san, { total: 0, active: 0 }];
        }
      }),
    );
    setHotelStats(Object.fromEntries(entries));
  };

  useEffect(() => {
    const load = async () => {
      setLoadingHotels(true);
      try {
        const hotelsRes = await api.get('/partner/hotels');
        const hotelList = hotelsRes.data.data || [];
        setHotels(hotelList);
        await loadHotelStats(hotelList);

        if (urlHotelId) {
          setSelected(urlHotelId);
        }
      } catch {
        showToast('Không tải được danh sách khách sạn', 'error');
      } finally {
        setLoadingHotels(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelected(urlHotelId || '');
  }, [urlHotelId]);

  useEffect(() => {
    if (!selectedHotel) { setRooms([]); return undefined; }
    let isMounted = true;
    const fetchRoomsData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/partner/rooms?hotelId=${selectedHotel}`);
        if (isMounted) setRooms(res.data.data || []);
      } catch {
        if (isMounted) setRooms([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRoomsData();
    return () => { isMounted = false; };
  }, [selectedHotel, refreshKey]);

  const triggerReloadRooms = async () => {
    setRefreshKey((prev) => prev + 1);
    if (hotels.length) await loadHotelStats(hotels);
  };

  const handleToggle = async (room) => {
    const action = room.trang_thai === 'hoat_dong' ? 'ẩn' : 'mở';
    if (!window.confirm(`Xác nhận ${action} loại phòng "${room.ten_loai}"?`)) return;
    try {
      await api.patch(`/partner/rooms/${room.ma_loai_phong}/toggle-status`);
      showToast(`Đã ${action} loại phòng!`);
      triggerReloadRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi thao tác', 'error');
    }
  };

  const currentHotel = hotels.find((h) => h.ma_khach_san === Number(selectedHotel));

  const locationOptions = useMemo(() => {
    const map = new Map();
    hotels.forEach((hotel) => {
      const id = hotel.dia_diem?.ma_dia_diem;
      const name = hotel.dia_diem?.ten_dia_diem;
      if (id && name) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [hotels]);

  const filteredHotels = useMemo(() => hotels.filter((hotel) => {
    const matchName = !hotelNameFilter || String(hotel.ma_khach_san) === hotelNameFilter;
    const matchLoc = !locationFilter || String(hotel.dia_diem?.ma_dia_diem) === locationFilter;
    const matchStatus = hotelStatusFilter === 'all'
      || (hotelStatusFilter === 'hoat_dong' && isHotelActive(hotel))
      || (hotelStatusFilter === 'inactive' && !isHotelActive(hotel));
    return matchName && matchLoc && matchStatus;
  }), [hotels, hotelNameFilter, locationFilter, hotelStatusFilter]);

  const hotelFilterTabs = useMemo(() => {
    const activeCount = hotels.filter(isHotelActive).length;
    return [
      { id: 'all', label: 'Tất cả', count: hotels.length },
      { id: 'hoat_dong', label: 'Hoạt động', count: activeCount },
      { id: 'inactive', label: 'Ngưng HĐ', count: hotels.length - activeCount },
    ];
  }, [hotels]);

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    const matchType = !roomTypeFilter || String(room.ma_loai_phong) === roomTypeFilter;
    const matchStatus = statusFilter === 'all' || room.trang_thai === statusFilter;
    return matchType && matchStatus;
  }), [rooms, roomTypeFilter, statusFilter]);

  const hasHotelListFilter = Boolean(
    hotelNameFilter
    || locationFilter
    || hotelStatusFilter !== 'all',
  );

  const hasRoomListFilter = Boolean(
    roomTypeFilter
    || statusFilter !== 'all',
  );

  const clearHotelListFilters = () => {
    setHotelNameFilter('');
    setLocationFilter('');
    setHotelStatusFilter('all');
  };

  const clearRoomListFilters = () => {
    setRoomTypeFilter('');
    setStatusFilter('all');
  };

  if (loadingHotels) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className="mgmt-page partner-room-mgmt">
      {toast && (
        <div className={`mgmt-toast ${toast.type}`} style={{ marginBottom: 16 }}>
          {toast.msg}
        </div>
      )}

      {!selectedHotel ? (
        <>
          <h1 className="partner-room-page-title">Quản lý loại phòng</h1>

          {hotels.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <p className="empty-state-text" style={{ marginBottom: 16 }}>
                  Bạn chưa có khách sạn nào. Hãy thêm khách sạn trước khi tạo loại phòng.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/partner/hotels')}>
                  + Thêm khách sạn
                </button>
              </div>
            </div>
          ) : (
            <HotelListSection
              hotels={hotels}
              hotelStats={hotelStats}
              hotelNameFilter={hotelNameFilter}
              onHotelNameFilterChange={setHotelNameFilter}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
              locationOptions={locationOptions}
              statusFilter={hotelStatusFilter}
              onStatusFilterChange={setHotelStatusFilter}
              filterTabs={hotelFilterTabs}
              filteredHotels={filteredHotels}
              onViewHotel={selectHotel}
              hasActiveFilter={hasHotelListFilter}
              onClearFilters={clearHotelListFilters}
            />
          )}
        </>
      ) : (
        <>
          <BackButton
            onClick={() => selectHotel('')}
            className="page-back-btn--standalone"
          />

          <div className="partner-room-mgmt-head">
            <h1 className="partner-room-page-title">Quản Lý Loại Phòng</h1>
            <button
              type="button"
              className="btn btn-primary partner-room-add-btn"
              onClick={() => navigate(`/partner/hotels/${selectedHotel}/rooms/create`)}
            >
              Thêm loại phòng
            </button>
          </div>

          {currentHotel && (
            <div className="partner-room-hotel-info">
              <p><strong>Khách sạn:</strong> {currentHotel.ten}</p>
              <p>
                <strong>Địa điểm:</strong>{' '}
                {[currentHotel.dia_chi, currentHotel.dia_diem?.ten_dia_diem].filter(Boolean).join(', ') || '—'}
              </p>
            </div>
          )}

          <RoomListSection
            rooms={rooms}
            loading={loading}
            roomTypeFilter={roomTypeFilter}
            onRoomTypeFilterChange={setRoomTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filteredRooms={filteredRooms}
            onViewRoom={setDetailRoom}
            onEditRoom={(room) => navigate(`/partner/hotels/${selectedHotel}/rooms/${room.ma_loai_phong}/edit`)}
            onToggleRoom={handleToggle}
            hasActiveFilter={hasRoomListFilter}
            onClearFilters={clearRoomListFilters}
          />

          {detailRoom && (
            <RoomDetailModal room={detailRoom} onClose={() => setDetailRoom(null)} />
          )}
        </>
      )}
    </div>
  );
};

export default RoomTypePage;
