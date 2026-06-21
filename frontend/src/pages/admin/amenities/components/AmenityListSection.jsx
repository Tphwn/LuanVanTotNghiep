import SearchBar from '../../../../components/common/management/SearchBar';
import { AmenityGroupCard } from './AmenityGroupCard';

export const AmenityListSection = ({
  keyword,
  onKeywordChange,
  loading,
  filteredGroups,
  onEdit,
  onDelete,
  onAdd,
}) => (
  <>
    <div className="amenity-toolbar">
      <SearchBar
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder="Tìm tiện nghi..."
      />
    </div>

    {loading ? (
      <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
    ) : (
      <div className="amenity-grid">
        {filteredGroups.map((group) => (
          <AmenityGroupCard
            key={group.id}
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdd={onAdd}
          />
        ))}
        {filteredGroups.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#5a7a72' }}>
            {keyword ? 'Không tìm thấy tiện nghi phù hợp' : 'Chưa có tiện nghi nào'}
          </div>
        )}
      </div>
    )}
  </>
);
