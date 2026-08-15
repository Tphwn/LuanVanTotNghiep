import { Eye, Pencil, Lock, Unlock } from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import FilterTabs from '../../../../components/common/management/FilterTabs';
import FilterActions from '../../../../components/common/management/FilterActions';
import ListPagination from '../../../../components/common/management/ListPagination';
import { formatCurrency } from '../../../../utils/bookingDisplay';
import { formatBedLabel } from '../../../../utils/bedDisplay';
import { TRANG_THAI } from '../constants';
import { getMainImage } from '../utils';
import DownSelect from '../../../../components/common/management/DownSelect';

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
  onClearFilters,
  variant = 'partner',
  pagination,
  keyword = '',
  onKeywordChange,
}) {
  const isAdmin = variant === 'admin';
  const showStatusTabs = filterTabs?.length > 0;

  return (
    <>
      {showStatusTabs && (
        <FilterTabs tabs={filterTabs} active={statusFilter} onChange={onStatusFilterChange} />
      )}

      <div className="mgmt-toolbar mgmt-toolbar--filters partner-room-filters partner-room-filters--room">
        <div className="partner-room-filter-field partner-room-filter-field--search">
          <label className="partner-room-filter-label" htmlFor="room-keyword-filter">Tìm kiếm</label>
          <input
            id="room-keyword-filter"
            type="search"
            className="mgmt-select-inline partner-room-filter-input"
            placeholder="Tên loại phòng..."
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
          />
        </div>
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="room-type-filter">Loại phòng</label>
          <DownSelect
            id="room-type-filter"
            className="mgmt-select-inline partner-room-filter-input"
            value={roomTypeFilter}
            onChange={(e) => onRoomTypeFilterChange(e.target.value)}
          >
            <option value="">Tất cả loại phòng</option>
            {rooms.map((room) => (
              <option key={room.ma_loai_phong} value={String(room.ma_loai_phong)}>
                {room.ten_loai}
              </option>
            ))}
          </DownSelect>
        </div>
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="room-status-filter">Trạng thái</label>
          <DownSelect
            id="room-status-filter"
            className="mgmt-select-inline partner-room-filter-input"
            value={statusFilter || 'all'}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="hoat_dong">Đang hoạt động</option>
            <option value="an">Đã ẩn</option>
          </DownSelect>
        </div>
        <div className="partner-room-filter-field partner-room-filter-field--action">
          <FilterActions onClear={onClearFilters} />
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
            <p className="empty-state-text">
              {isAdmin
                ? 'Khách sạn này chưa có danh sách loại phòng'
                : 'Khách sạn này chưa có loại phòng nào'}
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {statusFilter === 'an'
                ? 'Danh sách loại phòng đã ẩn trống'
                : statusFilter === 'hoat_dong'
                  ? 'Danh sách loại phòng đang hoạt động trống'
                  : 'Không tìm thấy loại phòng phù hợp'}
            </p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid partner-room-table partner-room-types-table">
              <thead>
                <tr>
                  <th className="partner-col-thumb">Ảnh đại diện</th>
                  <th className="partner-col-name">Tên loại phòng</th>
                  <th className="partner-col-area">Diện tích</th>
                  <th className="partner-col-capacity">Sức chứa</th>
                  <th className="partner-col-beds">Số giường</th>
                  <th className="partner-col-count">Tổng số phòng</th>
                  <th className="partner-col-money">Giá phòng</th>
                  <th className="partner-col-status">Trạng thái</th>
                  <th className="table-action-cell table-action-cell--compact partner-col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const mainImg = getMainImage(room);
                  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
                  const isActive = room.trang_thai === 'hoat_dong';
                  const partnerLocked = Boolean(room.khoa_do_doi_tac);
                  const adminLocked = !isAdmin && !isActive && !room.khoa_do_doi_tac;
                  const toggleDisabled = isAdmin ? partnerLocked : adminLocked;
                  const toggleTitle = isAdmin
                    ? (partnerLocked ? 'Bị khóa do đối tác' : (isActive ? 'Ẩn loại phòng' : 'Mở loại phòng'))
                    : (adminLocked ? 'Admin đã khóa' : (isActive ? 'Ẩn loại phòng' : 'Mở loại phòng'));
                  const tongPhong = room.so_luong_phong ?? 0;

                  return (
                    <tr key={room.ma_loai_phong}>
                      <td className="partner-col-thumb">
                        <div className="partner-room-thumb">
                          {mainImg ? (
                            <img src={resolveUploadUrl(mainImg.url)} alt="" />
                          ) : (
                            <span className="partner-room-thumb-empty">—</span>
                          )}
                        </div>
                      </td>
                      <td className="partner-room-type-name partner-col-name">{room.ten_loai?.toUpperCase()}</td>
                      <td className="partner-col-area">{room.dien_tich ? `${room.dien_tich} m²` : '—'}</td>
                      <td className="partner-col-capacity">{room.suc_chua} người lớn</td>
                      <td className="partner-col-beds">{room.loai_giuong || formatBedLabel(room)}</td>
                      <td className="partner-col-count">{tongPhong}</td>
                      <td className="partner-room-price-cell partner-col-money">
                        {room.gia_co_ban != null
                          ? formatCurrency(room.gia_co_ban)
                          : '—'}
                      </td>
                      <td className="partner-col-status">
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <ActionCell className="partner-col-actions table-action-cell--compact">
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
