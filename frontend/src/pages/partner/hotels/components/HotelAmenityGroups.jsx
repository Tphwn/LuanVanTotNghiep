import { useMemo } from 'react';
import { HOTEL_CATEGORY_GROUPS } from '../../../admin/amenities/constants';
import { groupAmenitiesByCategory } from '../../../admin/amenities/utils';
import { getAmenityLucideIcon } from '../../../../utils/amenityIcons';

export const HotelAmenityPicker = ({ amenities, selectedIds, onToggle }) => {
  const groups = useMemo(
    () => groupAmenitiesByCategory(amenities, HOTEL_CATEGORY_GROUPS),
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

export const HotelAmenityDisplay = ({ items }) => {
  const groups = useMemo(() => {
    const mapped = (items || []).map((tn) => ({
      ma_tien_nghi: tn.ma_tien_nghi,
      ten: tn.tien_nghi?.ten || tn.ten,
      bieu_tuong: tn.tien_nghi?.bieu_tuong || tn.bieu_tuong,
    }));
    return groupAmenitiesByCategory(mapped, HOTEL_CATEGORY_GROUPS)
      .filter((g) => g.items.length > 0);
  }, [items]);

  if (!groups.length) return null;

  return (
    <div className="partner-hotel-amenity-display">
      {groups.map((group) => (
        <div key={group.id} className="partner-hotel-amenity-section">
          <div className="partner-hotel-amenity-section-head">
            <group.Icon size={16} strokeWidth={1.6} />
            <span>{group.label}</span>
          </div>
          <div className="partner-hotel-amenity-tags">
            {group.items.map((item) => {
              const Icon = getAmenityLucideIcon(item.bieu_tuong || item.ten);
              return (
                <span key={item.ma_tien_nghi} className="mgmt-type-tag partner-hotel-amenity-tag">
                  <Icon size={13} strokeWidth={1.6} />
                  {item.ten}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
