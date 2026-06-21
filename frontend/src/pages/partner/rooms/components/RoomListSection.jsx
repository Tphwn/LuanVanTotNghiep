import SearchBar from '../../../../components/common/management/SearchBar';
import FilterTabs from '../../../../components/common/management/FilterTabs';
import RoomTypeCard from './RoomTypeCard';

export default function RoomListSection({
  rooms,
  activeCount,
  loading,
  keyword,
  onKeywordChange,
  hotels,
  selectedHotel,
  onSelectHotel,
  statusFilter,
  onStatusFilterChange,
  filterTabs,
  filteredRooms,
  onAddRoom,
  onEditRoom,
  onToggleRoom,
  onManageImages,
}) {
  return (
    <>
      <div className="mgmt-toolbar" style={{ marginBottom: 16 }}>
        <SearchBar
          value={keyword}
          onChange={onKeywordChange}
          placeholder="Tìm tên loại phòng..."
        />
        {hotels.length > 1 && (
          <select
            className="search-input"
            style={{ flex: '0 0 220px' }}
            value={selectedHotel}
            onChange={(e) => onSelectHotel(e.target.value)}
          >
            {hotels.map((h) => (
              <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
            ))}
          </select>
        )}
      </div>

      <FilterTabs tabs={filterTabs} active={statusFilter} onChange={onStatusFilterChange} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
      ) : rooms.length === 0 ? (
        <div className="content-card">
          <div className="empty-state">
            <p className="empty-state-text" style={{ marginBottom: 16 }}>
              Khách sạn này chưa có loại phòng nào
            </p>
            <button type="button" className="btn btn-primary" onClick={onAddRoom}>
              + Thêm loại phòng đầu tiên
            </button>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="content-card">
          <div className="empty-state">
            <p className="empty-state-text">Không có loại phòng phù hợp bộ lọc</p>
          </div>
        </div>
      ) : (
        <div className="rt-card-list">
          {filteredRooms.map((room) => (
            <RoomTypeCard
              key={room.ma_loai_phong}
              room={room}
              onEdit={() => onEditRoom(room)}
              onToggle={() => onToggleRoom(room)}
              onManageImages={() => onManageImages(room)}
            />
          ))}
        </div>
      )}
    </>
  );
}
