import { Pencil, Lock, Unlock } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';

export const AmenityListSection = ({
  loading,
  panelTitle,
  panelIcon: PanelIcon,
  availableGroups,
  categoryFilter,
  onCategoryChange,
  amenities,
  onEdit,
  onToggleLock,
}) => (
  <div className="mgmt-table-card amenity-list-card">
    <div className="amenity-list-toolbar">
      <div className="amenity-panel-title">
        {PanelIcon && <PanelIcon size={16} strokeWidth={1.8} />}
        <span>{panelTitle}</span>
      </div>
      {availableGroups.length > 0 && (
        <select
          className="mgmt-select-inline amenity-category-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label={`Lọc ${panelTitle}`}
        >
          {availableGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      )}
    </div>

    {loading ? (
      <div className="amenity-list-empty">Đang tải...</div>
    ) : amenities.length === 0 ? (
      <div className="amenity-list-empty">
        {availableGroups.length === 0 ? 'Chưa có tiện nghi nào' : 'Không có tiện nghi trong danh mục này'}
      </div>
    ) : (
      <div className="mgmt-table-scroll">
        <table className="data-table data-table-grid admin-mgmt-table amenity-list-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th className="amenity-name-head">Tên tiện nghi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {amenities.map((item) => {
              const ItemIcon = getAmenityLucideIcon(item.bieu_tuong || item.ten);
              const isLocked = item.trang_thai === 'an';
              return (
                <tr key={item.ma_tien_nghi} className={isLocked ? 'amenity-row--locked' : ''}>
                  <td>
                    <div className="amenity-table-icon">
                      <ItemIcon size={15} strokeWidth={1.6} />
                    </div>
                  </td>
                  <td className="amenity-name-cell">
                    <span className="amenity-name-text">{item.ten}</span>
                    {isLocked && <span className="badge badge-danger amenity-lock-badge">Đã khóa</span>}
                  </td>
                  <ActionCell>
                    <ActionButton
                      variant="edit"
                      iconOnly
                      icon={Pencil}
                      title="Sửa"
                      onClick={() => onEdit(item)}
                    />
                    <ActionButton
                      variant={isLocked ? 'unlock' : 'lock'}
                      iconOnly
                      icon={isLocked ? Unlock : Lock}
                      title={isLocked ? 'Mở khóa' : 'Khóa'}
                      onClick={() => onToggleLock(item)}
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
);
