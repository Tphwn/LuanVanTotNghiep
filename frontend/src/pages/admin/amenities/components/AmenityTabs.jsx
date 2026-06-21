import { Building2, BedDouble, Bell } from 'lucide-react';

const TABS = [
  { id: 'hotel', icon: Building2, label: 'Tiện nghi khách sạn' },
  { id: 'room', icon: BedDouble, label: 'Tiện nghi loại phòng' },
  { id: 'requests', icon: Bell, label: 'Yêu cầu từ đối tác', badgeKey: 'pendingCount' },
];

export const AmenityTabs = ({ activeTab, onTabChange, pendingCount }) => (
  <div className="amenity-tabs-row">
    {TABS.map(({ id, icon: Icon, label, badgeKey }) => {
      const badge = badgeKey === 'pendingCount' ? pendingCount : 0;
      return (
        <button
          key={id}
          type="button"
          className={`amenity-tab-btn${activeTab === id ? ' active' : ''}`}
          onClick={() => onTabChange(id)}
        >
          <Icon size={15} strokeWidth={1.8} />
          {label}
          {badge > 0 && <span className="amenity-tab-badge">{badge}</span>}
        </button>
      );
    })}
  </div>
);
