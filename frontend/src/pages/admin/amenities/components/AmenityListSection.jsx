import { Pencil, Lock, Unlock } from 'lucide-react';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';

const MAX_VISIBLE_ROWS = 10;

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
      <div
        className={`mgmt-table-scroll amenity-list-scroll${
          amenities.length > MAX_VISIBLE_ROWS ? ' amenity-list-scroll--limited' : ''
        }`}
      >
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
              const inUse = Boolean(item.dang_su_dung);
              const canLock = !isLocked && !inUse;

              // Tooltip khi rê chuột vào tên / nút khóa
              let statusHint = 'Đang hoạt động — có thể khóa';
              if (isLocked) {
                statusHint = 'Bị khóa';
              } else if (inUse) {
                statusHint = 'Không khóa vì đã được đối tác thêm';
              }

              const lockTitle = isLocked
                ? 'Mở khóa tiện nghi'
                : inUse
                  ? 'Không khóa vì đã được đối tác thêm'
                  : 'Khóa tiện nghi';

              return (
                <tr key={item.ma_tien_nghi} className={isLocked ? 'amenity-row--locked' : ''}>
                  <td>
                    <div className="amenity-table-icon" title={statusHint}>
                      <ItemIcon size={15} strokeWidth={1.6} />
                    </div>
                  </td>
                  <td className="amenity-name-cell">
                    <span
                      className={`amenity-name-text${isLocked ? ' amenity-name-text--locked' : ''}`}
                      title={statusHint}
                    >
                      {item.ten}
                    </span>
                  </td>
                  <ActionCell>
                    <ActionButton
                      variant="edit"
                      iconOnly
                      icon={Pencil}
                      title="Sửa"
                      onClick={() => onEdit(item)}
                    />
                    {/* Wrapper để tooltip vẫn hiện khi nút bị disabled */}
                    <span className="amenity-lock-btn-wrap" title={lockTitle}>
                      <ActionButton
                        variant={isLocked ? 'unlock' : 'lock'}
                        iconOnly
                        icon={isLocked ? Unlock : Lock}
                        title={lockTitle}
                        disabled={!isLocked && !canLock}
                        onClick={() => {
                          if (isLocked || canLock) onToggleLock(item);
                        }}
                      />
                    </span>
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
