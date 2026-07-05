import { Eye } from 'lucide-react';
import { resolveUploadUrl } from '../../../../utils/media';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import FilterTabs from '../../../../components/common/management/FilterTabs';
import { HOTEL_STATUS } from '../constants';
import { getMainImage } from '../utils';

const isHotelActive = (hotel) => hotel.trang_thai === 'hoat_dong';

const getHotelStatusLabel = (hotel) => {
  if (isHotelActive(hotel)) return { label: 'Đang hoạt động', cls: 'partner-room-status--active' };
  const meta = HOTEL_STATUS[hotel.trang_thai];
  return {
    label: meta?.label || 'Ngưng HĐ',
    cls: 'partner-room-status--inactive',
  };
};

export default function HotelListSection({
  hotels,
  hotelStats,
  hotelNameFilter,
  onHotelNameFilterChange,
  locationFilter,
  onLocationFilterChange,
  locationOptions,
  statusFilter,
  onStatusFilterChange,
  filterTabs,
  filteredHotels,
  onViewHotel,
  hasActiveFilter,
  onClearFilters,
}) {
  return (
    <>
      <div className="partner-room-filters">
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="hotel-name-filter">Tên khách sạn</label>
          <select
            id="hotel-name-filter"
            className="search-input partner-room-filter-input"
            value={hotelNameFilter}
            onChange={(e) => onHotelNameFilterChange(e.target.value)}
          >
            <option value="">Tất cả khách sạn</option>
            {hotels.map((hotel) => (
              <option key={hotel.ma_khach_san} value={String(hotel.ma_khach_san)}>
                {hotel.ten}
              </option>
            ))}
          </select>
        </div>
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="hotel-location-filter">Địa điểm</label>
          <select
            id="hotel-location-filter"
            className="search-input partner-room-filter-input"
            value={locationFilter}
            onChange={(e) => onLocationFilterChange(e.target.value)}
          >
            <option value="">Tất cả địa điểm</option>
            {locationOptions.map((loc) => (
              <option key={loc.id} value={String(loc.id)}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilter && (
          <div className="partner-room-filter-field partner-room-filter-field--action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="mgmt-table-card partner-room-table-card">
        <div className="mgmt-table-card-header partner-room-table-header">
          <h3 className="mgmt-table-card-title">Danh sách khách sạn</h3>
          <FilterTabs tabs={filterTabs} active={statusFilter} onChange={onStatusFilterChange} />
        </div>

        {filteredHotels.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có khách sạn phù hợp bộ lọc</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table partner-room-table">
              <thead>
                <tr>
                  <th>Ảnh đại diện</th>
                  <th>Tên khách sạn</th>
                  <th>Địa điểm</th>
                  <th>Số loại phòng</th>
                  <th>Trạng thái</th>
                  <th className="table-action-cell table-action-cell--compact">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => {
                  const mainImg = getMainImage(hotel);
                  const status = getHotelStatusLabel(hotel);
                  const roomCount = hotelStats[hotel.ma_khach_san]?.total ?? 0;

                  return (
                    <tr key={hotel.ma_khach_san}>
                      <td>
                        <div className="partner-room-thumb">
                          {mainImg ? (
                            <img src={resolveUploadUrl(mainImg.url)} alt="" />
                          ) : (
                            <span className="partner-room-thumb-empty">—</span>
                          )}
                        </div>
                      </td>
                      <td className="partner-room-name-cell">{hotel.ten}</td>
                      <td>{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                      <td>{roomCount}</td>
                      <td>
                        <span className={`partner-room-status ${status.cls}`}>{status.label}</span>
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Xem chi tiết"
                          onClick={() => onViewHotel(hotel.ma_khach_san)}
                        />
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
