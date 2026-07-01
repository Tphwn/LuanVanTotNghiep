import { AmenityGroupCard } from './AmenityGroupCard';

export const AmenityListSection = ({
  loading,
  groups,
  onEdit,
  onDelete,
}) => (
  <>
    {loading ? (
      <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
    ) : (
      <div className="amenity-grid">
        {groups.map((group) => (
          <AmenityGroupCard
            key={group.id}
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {groups.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#5a7a72' }}>
            Chưa có tiện nghi nào
          </div>
        )}
      </div>
    )}
  </>
);
