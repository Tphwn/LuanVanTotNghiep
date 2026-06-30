import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import HotelPickerSection from './components/HotelPickerSection';
import HotelBanner from './components/HotelBanner';
import RoomListSection from './components/RoomListSection';

const RoomTypePage = () => {
  const { hotelId: urlHotelId } = useParams();
  const navigate = useNavigate();

  const [hotels, setHotels]             = useState([]);
  const [hotelStats, setHotelStats]     = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedHotel, setSelected]    = useState(urlHotelId || '');
  const [rooms, setRooms]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState(null);
  const [refreshKey, setRefreshKey]     = useState(0);
  const [keyword, setKeyword]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectHotel = (id) => {
    const val = String(id);
    setSelected(val);
    setKeyword('');
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
      })
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
        } else if (hotelList.length === 1) {
          selectHotel(hotelList[0].ma_khach_san);
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
    if (urlHotelId) setSelected(urlHotelId);
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
    } catch {
      showToast('Lỗi thao tác', 'error');
    }
  };

  const currentHotel = hotels.find((h) => h.ma_khach_san === Number(selectedHotel));
  const activeCount  = rooms.filter((r) => r.trang_thai === 'hoat_dong').length;

  const filteredRooms = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchStatus  = statusFilter === 'all' || room.trang_thai === statusFilter;
      const matchKeyword = !text || room.ten_loai?.toLowerCase().includes(text);
      return matchStatus && matchKeyword;
    });
  }, [rooms, keyword, statusFilter]);

  const filterTabs = [
    { id: 'all',       label: 'Tất cả',      count: rooms.length },
    { id: 'hoat_dong', label: 'Đang bán',    count: activeCount },
    { id: 'an',        label: 'Đã ẩn',       count: rooms.length - activeCount },
  ];

  if (loadingHotels) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <ManagementHeader
        title="Quản Lý Loại Phòng"
        subtitle={
          currentHotel
            ? `Trang quản lý khách sạn: ${currentHotel.ten}`
            : 'Quản lý loại phòng của từng khách sạn'
        }
        actionLabel={selectedHotel ? '+ Thêm loại phòng' : undefined}
        onAction={selectedHotel ? () => navigate(`/partner/hotels/${selectedHotel}/rooms/create`) : undefined}
      />

      {toast && (
        <div className={`mgmt-toast ${toast.type}`} style={{ marginBottom: 16 }}>
          {toast.msg}
        </div>
      )}

      {!selectedHotel && (
        <HotelPickerSection
          hotels={hotels}
          hotelStats={hotelStats}
          selectedHotel={selectedHotel}
          onSelectHotel={selectHotel}
          onNavigateToHotels={() => navigate('/partner/hotels')}
        />
      )}

      {selectedHotel && currentHotel && (
        <>
          <HotelBanner
            hotel={currentHotel}
            hotelsCount={hotels.length}
            onChangeHotel={() => selectHotel('')}
          />

          <RoomListSection
            rooms={rooms}
            activeCount={activeCount}
            loading={loading}
            keyword={keyword}
            onKeywordChange={(e) => setKeyword(e.target.value)}
            hotels={hotels}
            selectedHotel={selectedHotel}
            onSelectHotel={selectHotel}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filterTabs={filterTabs}
            filteredRooms={filteredRooms}
            onAddRoom={() => navigate(`/partner/hotels/${selectedHotel}/rooms/create`)}
            onEditRoom={(room) => navigate(`/partner/hotels/${selectedHotel}/rooms/${room.ma_loai_phong}/edit`)}
            onToggleRoom={handleToggle}
            onManageImages={(room) => navigate(`/partner/rooms/${room.ma_loai_phong}/images`)}
          />
        </>
      )}
    </div>
  );
};

export default RoomTypePage;
