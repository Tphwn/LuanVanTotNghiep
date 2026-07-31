import { resolveUploadUrl } from '../../../../utils/media';
import { ActionCell } from '../../../../components/common/ActionButton';
import FilterTabs from '../../../../components/common/management/FilterTabs';
import FilterActions from '../../../../components/common/management/FilterActions';
import ListPagination from '../../../../components/common/management/ListPagination';
import { HOTEL_STATUS } from '../constants';
import { getMainImage } from '../utils';

const isHotelActive = (hotel) => hotel.trang_thai === 'hoat_dong';

const getHotelStatusLabel = (hotel) => {
  if (isHotelActive(hotel)) return { label: 'Đang hoạt động', cls: 'badge-success' };
  const meta = HOTEL_STATUS[hotel.trang_thai];
  return {
    label: meta?.label || 'Ngưng HĐ',
    cls: meta?.cls || 'badge-default',
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
  partnerFilter,
  onPartnerFilterChange,
  partnerOptions,
  hotelNameOptions = hotels,
  statusFilter,
  onStatusFilterChange,
  filterTabs,
  filteredHotels,
  onViewHotel,
  onClearFilters,
  pagination,
}) {
  const showPartnerFilter = Boolean(partnerOptions?.length);

  const emptyListMessage = (() => {
    const hasExtraFilter = Boolean(partnerFilter)
      || Boolean(hotelNameFilter)
      || Boolean(locationFilter);
    if (statusFilter === 'cho_duyet') {
      return hasExtraFilter
        ? 'Không tìm thấy khách sạn chờ duyệt phù hợp'
        : 'Danh sách khách sạn chờ duyệt trống';
    }
    if (statusFilter === 'bi_khoa' || statusFilter === 'tu_choi') {
      return hasExtraFilter
        ? 'Không tìm thấy khách sạn bị khóa phù hợp'
        : 'Danh sách khách sạn bị khóa trống';
    }
    if (statusFilter === 'hoat_dong') {
      return hasExtraFilter
        ? 'Không tìm thấy khách sạn đang hoạt động phù hợp'
        : 'Danh sách khách sạn đang hoạt động trống';
    }
    if (statusFilter === 'inactive') {
      return hasExtraFilter
        ? 'Không tìm thấy khách sạn ngưng hoạt động phù hợp'
        : 'Danh sách khách sạn ngưng hoạt động trống';
    }
    if (hasExtraFilter || (statusFilter && statusFilter !== 'all')) {
      return 'Không tìm thấy khách sạn phù hợp';
    }
    return 'Chưa có khách sạn nào';
  })();

  return (
    <>
      {filterTabs?.length > 0 && (
        <FilterTabs tabs={filterTabs} active={statusFilter} onChange={onStatusFilterChange} />
      )}

      <div className="mgmt-toolbar mgmt-toolbar--filters partner-room-filters partner-room-filters--admin">
        {showPartnerFilter && (
          <div className="partner-room-filter-field">
            <label className="partner-room-filter-label" htmlFor="hotel-partner-filter">Đối tác</label>
            <select
              id="hotel-partner-filter"
              className="mgmt-select-inline partner-room-filter-input"
              value={partnerFilter}
              onChange={(e) => onPartnerFilterChange(e.target.value)}
            >
              <option value="">Tất cả đối tác</option>
              {partnerOptions.map((partner) => (
                <option key={partner.ma_doi_tac} value={String(partner.ma_doi_tac)}>
                  {partner.ten_cong_ty}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="hotel-name-filter">Tên khách sạn</label>
          <select
            id="hotel-name-filter"
            className="mgmt-select-inline partner-room-filter-input"
            value={hotelNameFilter}
            onChange={(e) => onHotelNameFilterChange(e.target.value)}
          >
            <option value="">Tất cả khách sạn</option>
            {hotelNameOptions.map((hotel) => (
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
            className="mgmt-select-inline partner-room-filter-input"
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
        <div className="partner-room-filter-field">
          <label className="partner-room-filter-label" htmlFor="hotel-activity-filter">Trạng thái hoạt động</label>
          <select
            id="hotel-activity-filter"
            className="mgmt-select-inline partner-room-filter-input"
            value={statusFilter || 'all'}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="hoat_dong">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
        <div className="partner-room-filter-field partner-room-filter-field--action">
          <FilterActions onClear={onClearFilters} />
        </div>
      </div>

      <div className="mgmt-table-card partner-room-table-card">
        <div className="mgmt-table-card-header partner-room-table-header">
          <h3 className="mgmt-table-card-title">Danh sách khách sạn</h3>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">{emptyListMessage}</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid partner-room-table partner-room-hotels-table">
              <thead>
                <tr>
                  <th className="partner-col-thumb">Ảnh đại diện</th>
                  <th className="partner-col-name">Tên khách sạn</th>
                  {showPartnerFilter && <th className="partner-col-partner">Đối tác</th>}
                  <th className="partner-col-location">Địa điểm</th>
                  <th className="partner-col-count">Số loại phòng</th>
                  <th className="partner-col-status">Trạng thái</th>
                  <th className="table-action-cell partner-col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.map((hotel) => {
                  const mainImg = getMainImage(hotel);
                  const status = getHotelStatusLabel(hotel);
                  const roomCount = hotelStats[hotel.ma_khach_san]?.total ?? 0;

                  return (
                    <tr key={hotel.ma_khach_san}>
                      <td className="partner-col-thumb">
                        <div className="partner-room-thumb">
                          {mainImg ? (
                            <img src={resolveUploadUrl(mainImg.url)} alt="" />
                          ) : (
                            <span className="partner-room-thumb-empty">—</span>
                          )}
                        </div>
                      </td>
                      <td className="partner-room-name-cell partner-col-name">{hotel.ten}</td>
                      {showPartnerFilter && (
                        <td className="partner-col-partner">{hotel.doi_tac?.ten_cong_ty || '—'}</td>
                      )}
                      <td className="partner-col-location">{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                      <td className="partner-col-count">{roomCount}</td>
                      <td className="partner-col-status">
                        <span className={`badge ${status.cls}`}>{status.label}</span>
                      </td>
                      <ActionCell className="partner-col-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm partner-room-manage-btn"
                          onClick={() => onViewHotel(hotel.ma_khach_san)}
                        >
                          Quản lý phòng
                        </button>
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
