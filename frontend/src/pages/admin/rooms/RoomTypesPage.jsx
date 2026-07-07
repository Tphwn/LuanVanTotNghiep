import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Lock, Unlock } from 'lucide-react';
import api from '../../../services/api';
import adminHotelService from '../../../services/adminHotelService';
import { resolveUploadUrl } from '../../../utils/media';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import FilterTabs from '../../../components/common/management/FilterTabs';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import RoomDetailModal from '../../partner/rooms/components/RoomDetailModal';

const PAGE_SIZE = 10;
const APPROVED_HOTEL_STATUSES = ['hoat_dong', 'da_duyet', 'bi_khoa'];

const ROOM_STATUS = {
  hoat_dong: { label: 'Đang hoạt động', cls: 'partner-room-status--active' },
  an: { label: 'Đã ẩn', cls: 'partner-room-status--inactive' },
};

const getMainImage = (room) => {
  const imgs = room?.hinh_anh || [];
  return imgs.find((i) => i.la_anh_chinh === 1 || i.la_anh_chinh === true) || imgs[0];
};

const RoomTypesPage = () => {
  const [hotels, setHotels] = useState([]);
  const [partners, setPartners] = useState([]);
  const [locations, setLocations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [toast, setToast] = useState(null);

  const [partnerFilter, setPartnerFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailRoom, setDetailRoom] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      try {
        const [hotelsRes, metaRes] = await Promise.all([
          adminHotelService.getHotels(),
          api.get('/admin/room-types', { params: { trang_thai: 'all' } }),
        ]);
        const hotelList = (hotelsRes.data.data || hotelsRes.data || [])
          .filter((h) => APPROVED_HOTEL_STATUSES.includes(h.trang_thai));
        setHotels(hotelList);
        setPartners(metaRes.data.partners || []);
        setLocations(metaRes.data.locations || []);
      } catch {
        showToast('Không tải được dữ liệu bộ lọc', 'error');
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const params = { trang_thai: statusFilter };
      if (partnerFilter) params.ma_doi_tac = partnerFilter;
      if (locationFilter) params.ma_dia_diem = locationFilter;
      if (hotelFilter) params.ma_khach_san = hotelFilter;

      const res = await api.get('/admin/room-types', { params });
      setRooms(res.data.data || []);
      setStats(res.data.stats || null);
    } catch {
      setRooms([]);
      setStats(null);
      showToast('Không tải được danh sách loại phòng', 'error');
    } finally {
      setLoadingRooms(false);
    }
  }, [partnerFilter, locationFilter, hotelFilter, statusFilter]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const hotelOptions = useMemo(() => hotels.filter((hotel) => {
    const matchPartner = !partnerFilter || String(hotel.doi_tac?.ma_doi_tac) === partnerFilter;
    const matchLocation = !locationFilter || String(hotel.ma_dia_diem) === locationFilter;
    return matchPartner && matchLocation;
  }), [hotels, partnerFilter, locationFilter]);

  useEffect(() => {
    if (!hotelFilter) return;
    const stillValid = hotelOptions.some((h) => String(h.ma_khach_san) === hotelFilter);
    if (!stillValid) setHotelFilter('');
  }, [hotelFilter, hotelOptions]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats?.total ?? rooms.length },
    { id: 'hoat_dong', label: 'Đang mở', count: stats?.active ?? 0 },
    { id: 'an', label: 'Đã ẩn', count: stats?.hidden ?? 0 },
  ], [stats, rooms.length]);

  const {
    pagedItems: pagedRooms,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(rooms, PAGE_SIZE, [partnerFilter, locationFilter, hotelFilter, statusFilter]);

  const handleToggleStatus = async (room) => {
    const isHidden = room.trang_thai === 'an';
    const msg = isHidden
      ? `Mở lại loại phòng "${room.ten_loai}"?`
      : `Ẩn loại phòng "${room.ten_loai}" khỏi hệ thống?`;
    if (!window.confirm(msg)) return;

    try {
      const endpoint = isHidden ? 'show' : 'hide';
      await api.patch(`/admin/room-types/${room.ma_loai_phong}/${endpoint}`);
      showToast(isHidden ? 'Đã mở loại phòng' : 'Đã ẩn loại phòng');
      loadRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
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

  const hasActiveFilter = Boolean(
    partnerFilter
    || locationFilter
    || hotelFilter
    || statusFilter !== 'all',
  );

  const clearFilters = () => {
    setPartnerFilter('');
    setLocationFilter('');
    setHotelFilter('');
    setStatusFilter('all');
  };

  if (loadingMeta) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className="mgmt-page partner-room-mgmt mgmt-list-page">
      <h1 className="partner-room-page-title">Quản lý loại phòng</h1>
      <p className="partner-room-page-subtitle">
        Danh sách loại phòng của tất cả đối tác — dùng bộ lọc để thu hẹp kết quả
      </p>

      {toast && (
        <div className={`mgmt-toast ${toast.type}`} style={{ marginBottom: 16 }}>
          {toast.msg}
        </div>
      )}

      <FilterTabs tabs={filterTabs} active={statusFilter} onChange={setStatusFilter} />

      <div className="partner-room-filters partner-room-filters--admin">
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="admin-rt-partner">Đối tác</label>
          <select
            id="admin-rt-partner"
            className="search-input partner-room-filter-input"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
          >
            <option value="">Tất cả đối tác</option>
            {partners.map((p) => (
              <option key={p.ma_doi_tac} value={String(p.ma_doi_tac)}>{p.ten_cong_ty}</option>
            ))}
          </select>
        </div>
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="admin-rt-location">Địa điểm</label>
          <select
            id="admin-rt-location"
            className="search-input partner-room-filter-input"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">Tất cả địa điểm</option>
            {locations.map((loc) => (
              <option key={loc.ma_dia_diem} value={String(loc.ma_dia_diem)}>{loc.ten_dia_diem}</option>
            ))}
          </select>
        </div>
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="admin-rt-hotel">Khách sạn</label>
          <select
            id="admin-rt-hotel"
            className="search-input partner-room-filter-input"
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
          >
            <option value="">Tất cả khách sạn</option>
            {hotelOptions.map((hotel) => (
              <option key={hotel.ma_khach_san} value={String(hotel.ma_khach_san)}>{hotel.ten}</option>
            ))}
          </select>
        </div>
        {hasActiveFilter && (
          <div className="partner-room-filter-field partner-room-filter-field--action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="mgmt-table-card partner-room-table-card">
        <div className="mgmt-table-card-header partner-room-table-header">
          <h3 className="mgmt-table-card-title">
            Danh sách loại phòng ({rooms.length})
          </h3>
        </div>

        {loadingRooms ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có loại phòng phù hợp bộ lọc</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th>Ảnh đại diện</th>
                    <th>Tên loại phòng</th>
                    <th>Khách sạn</th>
                    <th>Diện tích</th>
                    <th>Sức chứa</th>
                    <th>Số giường</th>
                    <th>Số phòng</th>
                    <th>Trạng thái</th>
                    <th className="table-action-cell table-action-cell--compact">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRooms.map((room) => {
                    const mainImg = getMainImage(room);
                    const st = ROOM_STATUS[room.trang_thai] || { label: room.trang_thai, cls: 'partner-room-status--inactive' };
                    const isActive = room.trang_thai === 'hoat_dong';
                    const partnerLocked = Boolean(room.khoa_do_doi_tac);
                    const moBan = room.so_luong_mo_ban ?? 0;
                    const tongPhong = room.so_luong_phong ?? 0;

                    return (
                      <tr key={room.ma_loai_phong}>
                        <td>
                          <div className="partner-room-thumb">
                            {mainImg ? (
                              <img src={resolveUploadUrl(mainImg.url)} alt="" />
                            ) : (
                              <span className="partner-room-thumb-empty">—</span>
                            )}
                          </div>
                        </td>
                        <td className="partner-room-type-name admin-cell-name">{room.ten_loai?.toUpperCase()}</td>
                        <td>
                          <div className="admin-cell-name">{room.khach_san?.ten}</div>
                          <div className="mgmt-cell-sub">{room.khach_san?.doi_tac?.ten_cong_ty}</div>
                        </td>
                        <td>{room.dien_tich ? `${room.dien_tich} m²` : '—'}</td>
                        <td>{room.suc_chua} người lớn</td>
                        <td>{room.so_giuong}</td>
                        <td>{moBan}/{tongPhong}</td>
                        <td>
                          <span className={`partner-room-status ${st.cls}`}>{st.label}</span>
                        </td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Xem chi tiết"
                            onClick={() => handleViewRoom(room)}
                          />
                          <ActionButton
                            variant={isActive ? 'lock' : 'unlock'}
                            iconOnly
                            icon={isActive ? Lock : Unlock}
                            title={partnerLocked ? 'Bị khóa do đối tác' : (isActive ? 'Ẩn loại phòng' : 'Mở loại phòng')}
                            disabled={partnerLocked}
                            onClick={() => handleToggleStatus(room)}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {showPagination && (
              <ListPagination
                total={rooms.length}
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
    </div>
  );
};

export default RoomTypesPage;
