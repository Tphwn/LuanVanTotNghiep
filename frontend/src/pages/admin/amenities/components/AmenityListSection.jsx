import { Pencil, Lock, Unlock } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import ListPagination from '../../../../components/common/management/ListPagination';
import useListPagination from '../../../../hooks/useListPagination';
import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';

const PAGE_SIZE = 10;

export const AmenityListSection = ({
  loading,
  availableGroups,
  categoryFilter,
  onCategoryChange,
  amenities,
  onEdit,
  onToggleLock,
  listKey = '',
}) => {
  const {
    pagedItems,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(amenities, PAGE_SIZE, [listKey, categoryFilter]);

  return (
    <div className="mgmt-table-card amenity-list-card">
      <div className="amenity-list-toolbar">
        <div className="amenity-panel-title">
          <span>Danh sách tiện nghi</span>
          <span className="amenity-list-count">{amenities.length}</span>
        </div>
        <select
          className="mgmt-select-inline amenity-category-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Lọc theo danh mục"
        >
          <option value="all">Tất cả danh mục</option>
          {availableGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="amenity-list-empty">Đang tải...</div>
      ) : amenities.length === 0 ? (
        <div className="amenity-list-empty">
          {availableGroups.length === 0 ? 'Chưa có tiện nghi nào' : 'Không có tiện nghi trong danh mục này'}
        </div>
      ) : (
        <>
          <div className="mgmt-table-scroll amenity-list-scroll">
            <table className="data-table data-table-grid admin-mgmt-table amenity-list-table">
              <thead>
                <tr>
                  <th className="amenity-col-icon">Icon</th>
                  <th className="amenity-name-head">Tên tiện nghi</th>
                  <th className="amenity-col-status">Trạng thái</th>
                  <th className="amenity-col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => {
                  const ItemIcon = getAmenityLucideIcon(item.bieu_tuong, item.ten);
                  const isLocked = item.trang_thai === 'an';
                  const lockTitle = isLocked ? 'Mở khóa tiện nghi' : 'Khóa tiện nghi';

                  return (
                    <tr
                      key={item.ma_tien_nghi}
                      className={isLocked ? 'amenity-row--hidden' : ''}
                    >
                      <td className="amenity-col-icon">
                        <div className="amenity-table-icon">
                          <ItemIcon size={15} strokeWidth={1.6} />
                        </div>
                      </td>
                      <td className="amenity-name-cell">
                        <span className="amenity-name-text">{item.ten}</span>
                      </td>
                      <td className="amenity-col-status">
                        <span className={`badge ${isLocked ? 'badge-default' : 'badge-success'}`}>
                          {isLocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <ActionCell className="amenity-col-actions">
                        <ActionButton
                          variant="edit"
                          iconOnly
                          icon={Pencil}
                          title="Sửa"
                          onClick={() => onEdit(item)}
                        />
                        <span className="amenity-lock-btn-wrap" title={lockTitle}>
                          <ActionButton
                            variant={isLocked ? 'unlock' : 'lock'}
                            iconOnly
                            icon={isLocked ? Unlock : Lock}
                            title={lockTitle}
                            onClick={() => onToggleLock(item)}
                          />
                        </span>
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showPagination && (
            <ListPagination
              total={amenities.length}
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
  );
};
