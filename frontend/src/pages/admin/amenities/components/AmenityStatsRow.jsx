import { Building2, BedDouble, Bell } from 'lucide-react';

export const AmenityStatsRow = ({
  hotelCount,
  hotelCategoryCount,
  roomCount,
  roomCategoryCount,
  pendingCount,
}) => (
  <div className="amenity-stats-row">
    <div className="amenity-stat-card">
      <div className="amenity-stat-icon" style={{ background: '#e8f5f1', color: '#3C7363' }}>
        <Building2 size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="amenity-stat-label">Tiện nghi khách sạn</div>
        <div className="amenity-stat-value">{hotelCount}</div>
        <div className="amenity-stat-sub">{hotelCategoryCount} danh mục</div>
      </div>
    </div>
    <div className="amenity-stat-card">
      <div className="amenity-stat-icon" style={{ background: '#eef2ff', color: '#0958d9' }}>
        <BedDouble size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="amenity-stat-label">Tiện nghi loại phòng</div>
        <div className="amenity-stat-value">{roomCount}</div>
        <div className="amenity-stat-sub">{roomCategoryCount} danh mục</div>
      </div>
    </div>
    <div className="amenity-stat-card">
      <div className="amenity-stat-icon" style={{ background: '#fff8e6', color: '#b36b00' }}>
        <Bell size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="amenity-stat-label">Yêu cầu đang chờ</div>
        <div className="amenity-stat-value">{pendingCount}</div>
        <div className="amenity-stat-sub">Từ đối tác</div>
      </div>
    </div>
  </div>
);
