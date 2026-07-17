import { Eye, Pencil, Lock, Unlock } from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import FilterTabs from '../../../../components/common/management/FilterTabs';
import FilterActions from '../../../../components/common/management/FilterActions';
import ListPagination from '../../../../components/common/management/ListPagination';
import { TRANG_THAI } from '../constants';
import { getMainImage } from '../utils';

export default function RoomListSection({
  rooms,
  loading,
  roomTypeFilter,
  onRoomTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  filterTabs,
  filteredRooms,
  onViewRoom,
  onEditRoom,
  onToggleRoom,
  onApplyFilters,
  onClearFilters,
  variant = 'partner',
  pagination,
}) {
  const isAdmin = variant === 'admin';
  const showStatusTabs = filterTabs?.length > 0;

  return (
    <>
      {showStatusTabs && (
        <FilterTabs tabs={filterTabs} active={statusFilter} onChange={onStatusFilterChange} />
      )}

      <div className="partner-room-filters partner-room-filters--room">
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="room-type-filter">Loại phòng</label>
          <select
            id="room-type-filter"
            className="search-input partner-room-filter-input"
            value={roomTypeFilter}
            onChange={(e) => onRoomTypeFilterChange(e.target.value)}
          >
            <option value="">Tất cả loại phòng</option>
            {rooms.map((room) => (
              <option key={room.ma_loai_phong} value={String(room.ma_loai_phong)}>
                {room.ten_loai}
              </option>
            ))}
          </select>
        </div>
        {!showStatusTabs && (
          <div className="partner-room-filter-field">
            <label className="partner-room-filter-label" htmlFor="room-status-filter">Trạng thái</label>
            <select
              id="room-status-filter"
              className="search-input partner-room-filter-input"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="hoat_dong">Đang hoạt động</option>
              <option value="an">Đã ẩn</option>
            </select>
          </div>
        )}
        <div className="partner-room-filter-field partner-room-filter-field--action">
          <FilterActions
            onApply={onApplyFilters || (() => {})}
            onClear={onClearFilters}
          />
        </div>
      </div>

      <div className="mgmt-table-card partner-room-table-card">
        <div className="mgmt-table-card-header">
          <h3 className="mgmt-table-card-title">
            Danh sách loại phòng ({filteredRooms.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Khách sạn này chưa có loại phòng nào</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có loại phòng phù hợp bộ lọc</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table partner-room-table">
              <thead>
                <tr>
                  <th>Ảnh đại diện</th>
                  <th>Tên loại phòng</th>
                  <th>Diện tích</th>
                  <th>Sức chứa</th>
                  <th>Số giường</th>
                  <th>Còn trống</th>
                  <th>Trạng thái</th>
                  <th className="table-action-cell table-action-cell--compact">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const mainImg = getMainImage(room);
                  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai };
                  const isActive = room.trang_thai === 'hoat_dong';
                  const partnerLocked = Boolean(room.khoa_do_doi_tac);
                  const adminLocked = !isAdmin && !isActive && !room.khoa_do_doi_tac;
                  const toggleDisabled = isAdmin ? partnerLocked : adminLocked;
                  const toggleTitle = isAdmin
                    ? (partnerLocked ? 'Bị khóa do đối tác' : (isActive ? 'Ẩn loại phòng' : 'Mở loại phòng'))
                    : (adminLocked ? 'Admin đã khóa' : (isActive ? 'Ẩn loại phòng' : 'Mở loại phòng'));
                  const conLai = room.phong_con_lai ?? room.so_luong_mo_ban ?? 0;
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
                      <td className="partner-room-type-name">{room.ten_loai?.toUpperCase()}</td>
                      <td>{room.dien_tich ? `${room.dien_tich} m²` : '—'}</td>
                      <td>{room.suc_chua} người lớn</td>
                      <td>{room.so_giuong}</td>
                      <td>{conLai}/{tongPhong}</td>
                      <td>
                        <span className={`partner-room-status ${isActive ? 'partner-room-status--active' : 'partner-room-status--inactive'}`}>
                          {st.label}
                        </span>
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Xem chi tiết"
                          onClick={() => onViewRoom(room)}
                        />
                        {!isAdmin && onEditRoom && (
                          <ActionButton
                            variant="edit"
                            iconOnly
                            icon={Pencil}
                            title="Sửa"
                            onClick={() => onEditRoom(room)}
                          />
                        )}
                        <ActionButton
                          variant={isActive ? 'lock' : 'unlock'}
                          iconOnly
                          icon={isActive ? Lock : Unlock}
                          title={toggleTitle}
                          disabled={toggleDisabled}
                          onClick={() => onToggleRoom(room)}
                        />
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination?.showPagination && (
          <ListPagination
            total={pagination.total}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            rangeFrom={pagination.rangeFrom}
            rangeTo={pagination.rangeTo}
            pageNumbers={pagination.pageNumbers}
            onPageChange={pagination.onPageChange}
          />
        )}
      </div>
    </>
  );
}
