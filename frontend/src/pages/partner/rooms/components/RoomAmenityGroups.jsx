import { useMemo } from 'react';
import { ROOM_CATEGORY_GROUPS } from '../../../admin/amenities/constants';
import { groupAmenitiesByCategory } from '../../../admin/amenities/utils';

export const RoomAmenityPicker = ({ amenities, selectedIds, onToggle }) => {
  const groups = useMemo(
    () => groupAmenitiesByCategory(amenities, ROOM_CATEGORY_GROUPS),
    [amenities],
  );

  return (
    <div className="amenity-grid partner-hotel-amenity-grid">
      {groups.map((group) => (
        <div key={group.id} className="amenity-group-card">
          <div className="amenity-group-header">
            <div className="amenity-group-icon-wrap">
              <group.Icon size={17} strokeWidth={1.5} />
            </div>
            <div>
              <div className="amenity-group-title">{group.label}</div>
              <div className="amenity-group-sub">{group.items.length} tiện nghi</div>
            </div>
          </div>
          <div className="partner-amenity-picker">
            {group.items.length === 0 ? (
              <div className="amenity-group-empty">Chưa có tiện nghi</div>
            ) : (
              group.items.map((a) => {
                const checked = selectedIds.includes(a.ma_tien_nghi);
                return (
                  <button
                    key={a.ma_tien_nghi}
                    type="button"
                    className={`btn btn-sm ${checked ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onToggle(a.ma_tien_nghi)}
                  >
                    {a.ten}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
