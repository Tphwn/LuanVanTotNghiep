import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import adminHotelService from '../../../services/adminHotelService';
import BackButton from '../../../components/common/BackButton';
import useListPagination from '../../../hooks/useListPagination';
import HotelListSection from '../../partner/rooms/components/HotelListSection';
import RoomListSection from '../../partner/rooms/components/RoomListSection';
import RoomDetailModal from '../../partner/rooms/components/RoomDetailModal';
import AdminRoomTypeLockConfirmModal from './components/AdminRoomTypeLockConfirmModal';

const PAGE_SIZE = 10;

const APPROVED_HOTEL_STATUSES = ['hoat_dong', 'da_duyet', 'bi_khoa'];

const isHotelActive = (hotel) => hotel.trang_thai === 'hoat_dong';

const RoomTypesPage = () => {
  const { hotelId: urlHotelId } = useParams();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [partners, setPartners] = useState([]);
  const [locations, setLocations] = useState([]);
  const [hotelStats, setHotelStats] = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(urlHotelId || '');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lockTarget, setLockTarget] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);

  const [partnerFilter, setPartnerFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [hotelNameFilter, setHotelNameFilter] = useState('');
  const [hotelStatusFilter, setHotelStatusFilter] = useState('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectHotel = (id) => {
    const val = String(id);
    setSelectedHotel(val);
    setRoomTypeFilter('');
    setRoomStatusFilter('all');
    navigate(id ? `/admin/room-types/hotels/${id}` : '/admin/room-types');
  };

  const loadHotelStats = async (hotelList) => {
    const entries = await Promise.all(
      hotelList.map(async (hotel) => {
        try {
          const res = await api.get('/admin/room-types', {
            params: { ma_khach_san: hotel.ma_khach_san, trang_thai: 'all' },
          });
          const list = res.data.data || [];
          return [hotel.ma_khach_san, {
            total: list.length,
            active: list.filter((room) => room.trang_thai === 'hoat_dong').length,
          }];
        } catch {
          return [hotel.ma_khach_san, { total: 0, active: 0 }];
        }
      }),
    );
    setHotelStats(Object.fromEntries(entries));
  };

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingHotels(true);
      try {
        const [hotelsRes, metaRes] = await Promise.all([
          adminHotelService.getHotels(),
          api.get('/admin/room-types', { params: { trang_thai: 'all' } }),
        ]);
        const hotelList = (hotelsRes.data.data || hotelsRes.data || [])
          .filter((hotel) => APPROVED_HOTEL_STATUSES.includes(hotel.trang_thai));
        setHotels(hotelList);
        setPartners(metaRes.data.partners || []);
        setLocations(metaRes.data.locations || []);
        await loadHotelStats(hotelList);

        if (urlHotelId) {
          setSelectedHotel(urlHotelId);
        }
      } catch {
        showToast('Không tải được danh sách khách sạn', 'error');
      } finally {
        setLoadingHotels(false);
      }
    };
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedHotel(urlHotelId || '');
  }, [urlHotelId]);

  useEffect(() => {
    if (!selectedHotel) {
      setRooms([]);
      return undefined;
    }

    let isMounted = true;
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await api.get('/admin/room-types', {
          params: { ma_khach_san: selectedHotel, trang_thai: 'all' },
        });
        if (isMounted) setRooms(res.data.data || []);
      } catch {
        if (isMounted) setRooms([]);
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    };
    fetchRooms();
    return () => { isMounted = false; };
  }, [selectedHotel, refreshKey]);

  const triggerReloadRooms = async () => {
    setRefreshKey((prev) => prev + 1);
    if (hotels.length) await loadHotelStats(hotels);
  };

  const locationOptions = useMemo(() => {
    if (locations.length) {
      return locations.map((loc) => ({ id: loc.ma_dia_diem, name: loc.ten_dia_diem }));
    }
    const map = new Map();
    hotels.forEach((hotel) => {
      const id = hotel.dia_diem?.ma_dia_diem ?? hotel.ma_dia_diem;
      const name = hotel.dia_diem?.ten_dia_diem;
      if (id && name) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [hotels, locations]);

  const hotelNameOptions = useMemo(() => hotels.filter((hotel) => {
    const partnerId = hotel.doi_tac?.ma_doi_tac ?? hotel.ma_doi_tac;
    const locationId = hotel.dia_diem?.ma_dia_diem ?? hotel.ma_dia_diem;
    const matchPartner = !partnerFilter || String(partnerId) === partnerFilter;
    const matchLoc = !locationFilter || String(locationId) === locationFilter;
    return matchPartner && matchLoc;
  }), [hotels, partnerFilter, locationFilter]);

  useEffect(() => {
    if (!hotelNameFilter) return;
    const stillValid = hotelNameOptions.some((h) => String(h.ma_khach_san) === hotelNameFilter);
    if (!stillValid) setHotelNameFilter('');
  }, [hotelNameFilter, hotelNameOptions]);

  const filteredHotels = useMemo(() => hotels.filter((hotel) => {
    const partnerId = hotel.doi_tac?.ma_doi_tac ?? hotel.ma_doi_tac;
    const locationId = hotel.dia_diem?.ma_dia_diem ?? hotel.ma_dia_diem;
    const matchPartner = !partnerFilter || String(partnerId) === partnerFilter;
    const matchName = !hotelNameFilter || String(hotel.ma_khach_san) === hotelNameFilter;
    const matchLoc = !locationFilter || String(locationId) === locationFilter;
    const matchStatus = hotelStatusFilter === 'all'
      || (hotelStatusFilter === 'hoat_dong' && isHotelActive(hotel))
      || (hotelStatusFilter === 'inactive' && !isHotelActive(hotel));
    return matchPartner && matchName && matchLoc && matchStatus;
  }), [hotels, partnerFilter, hotelNameFilter, locationFilter, hotelStatusFilter]);

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
    const matchStatus = roomStatusFilter === 'all' || room.trang_thai === roomStatusFilter;
    return matchType && matchStatus;
  }), [rooms, roomTypeFilter, roomStatusFilter]);

  const roomFilterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: rooms.length },
    { id: 'hoat_dong', label: 'Đang mở', count: rooms.filter((r) => r.trang_thai === 'hoat_dong').length },
    { id: 'an', label: 'Đã ẩn', count: rooms.filter((r) => r.trang_thai === 'an').length },
  ], [rooms]);

  const hotelPagination = useListPagination(filteredHotels, PAGE_SIZE, [
    partnerFilter,
    hotelNameFilter,
    locationFilter,
    hotelStatusFilter,
  ]);

  const roomPagination = useListPagination(filteredRooms, PAGE_SIZE, [
    selectedHotel,
    roomTypeFilter,
    roomStatusFilter,
  ]);

  const currentHotel = hotels.find((hotel) => String(hotel.ma_khach_san) === String(selectedHotel));

  const hasHotelListFilter = Boolean(
    partnerFilter
    || hotelNameFilter
    || locationFilter
    || hotelStatusFilter !== 'all',
  );

  const hasRoomListFilter = Boolean(
    roomTypeFilter
    || roomStatusFilter !== 'all',
  );

  const clearHotelListFilters = () => {
    setPartnerFilter('');
    setHotelNameFilter('');
    setLocationFilter('');
    setHotelStatusFilter('all');
  };

  const clearRoomListFilters = () => {
    setRoomTypeFilter('');
    setRoomStatusFilter('all');
  };

  const handleToggleRoom = (room) => {
    if (room.khoa_do_doi_tac) return;
    const isHidden = room.trang_thai === 'an';
    setLockTarget({ room, action: isHidden ? 'show' : 'hide' });
  };

  const handleLockConfirm = async (lyDo) => {
    if (!lockTarget) return;
    setLockLoading(true);
    try {
      const { room, action } = lockTarget;
      if (action === 'hide') {
        await api.patch(`/admin/room-types/${room.ma_loai_phong}/hide`, { ly_do: lyDo });
        showToast('Đã ẩn loại phòng.');
      } else {
        await api.patch(`/admin/room-types/${room.ma_loai_phong}/show`);
        showToast('Đã mở loại phòng.');
      }
      setLockTarget(null);
      triggerReloadRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setLockLoading(false);
    }
  };

  const handleViewRoom = async (room) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/room-types/${room.ma_loai_phong}`);
      setDetailRoom(res.data.data || room);
    } catch {
      setDetailRoom(room);
    } finally {
      setDetailLoading(false);
    }
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
          <p className="partner-room-page-subtitle">
            Chọn khách sạn để xem danh sách loại phòng
          </p>

          {hotels.length === 0 ? (
            <div className="content-card">
              <div className="empty-state">
                <p className="empty-state-text">Chưa có khách sạn nào được duyệt</p>
              </div>
            </div>
          ) : (
            <HotelListSection
              hotels={hotels}
              hotelNameOptions={hotelNameOptions}
              hotelStats={hotelStats}
              partnerFilter={partnerFilter}
              onPartnerFilterChange={setPartnerFilter}
              partnerOptions={partners}
              hotelNameFilter={hotelNameFilter}
              onHotelNameFilterChange={setHotelNameFilter}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
              locationOptions={locationOptions}
              statusFilter={hotelStatusFilter}
              onStatusFilterChange={setHotelStatusFilter}
              filterTabs={hotelFilterTabs}
              filteredHotels={hotelPagination.pagedItems}
              onViewHotel={selectHotel}
              hasActiveFilter={hasHotelListFilter}
              onClearFilters={clearHotelListFilters}
              pagination={{
                showPagination: hotelPagination.showPagination,
                total: filteredHotels.length,
                currentPage: hotelPagination.currentPage,
                totalPages: hotelPagination.totalPages,
                rangeFrom: hotelPagination.rangeFrom,
                rangeTo: hotelPagination.rangeTo,
                pageNumbers: hotelPagination.pageNumbers,
                onPageChange: hotelPagination.setPage,
              }}
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
          </div>

          {currentHotel && (
            <div className="partner-room-hotel-info">
              <p><strong>Khách sạn:</strong> {currentHotel.ten}</p>
              <p><strong>Đối tác:</strong> {currentHotel.doi_tac?.ten_cong_ty || '—'}</p>
              <p>
                <strong>Địa điểm:</strong>{' '}
                {[currentHotel.dia_chi, currentHotel.dia_diem?.ten_dia_diem].filter(Boolean).join(', ') || '—'}
              </p>
            </div>
          )}

          <RoomListSection
            variant="admin"
            rooms={rooms}
            loading={loadingRooms}
            roomTypeFilter={roomTypeFilter}
            onRoomTypeFilterChange={setRoomTypeFilter}
            statusFilter={roomStatusFilter}
            onStatusFilterChange={setRoomStatusFilter}
            filterTabs={roomFilterTabs}
            filteredRooms={roomPagination.pagedItems}
            onViewRoom={handleViewRoom}
            onToggleRoom={handleToggleRoom}
            hasActiveFilter={hasRoomListFilter}
            onClearFilters={clearRoomListFilters}
            pagination={{
              showPagination: roomPagination.showPagination,
              total: filteredRooms.length,
              currentPage: roomPagination.currentPage,
              totalPages: roomPagination.totalPages,
              rangeFrom: roomPagination.rangeFrom,
              rangeTo: roomPagination.rangeTo,
              pageNumbers: roomPagination.pageNumbers,
              onPageChange: roomPagination.setPage,
            }}
          />

          <AdminRoomTypeLockConfirmModal
            room={lockTarget?.room}
            action={lockTarget?.action}
            loading={lockLoading}
            onClose={() => !lockLoading && setLockTarget(null)}
            onConfirm={handleLockConfirm}
          />

          {detailLoading && (
            <div className="modal-overlay" role="presentation">
              <div className="modal-box" style={{ padding: 32, textAlign: 'center' }}>
                Đang tải chi tiết...
              </div>
            </div>
          )}

          {detailRoom && !detailLoading && (
            <RoomDetailModal room={detailRoom} onClose={() => setDetailRoom(null)} />
          )}
        </>
      )}
    </div>
  );
};

export default RoomTypesPage;
