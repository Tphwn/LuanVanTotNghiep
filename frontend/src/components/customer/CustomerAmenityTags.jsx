import CustomerAmenityTag from './CustomerAmenityTag';

const getItemLabel = (item) => (typeof item === 'string' ? item : item?.ten || '');

const getItemKey = (item, index) => {
  if (typeof item === 'object' && item) {
    return item.ma_tien_nghi || item.ten || index;
  }
  return item || index;
};

const CustomerAmenityTags = ({
  items = [],
  max,
  moreTo,
  moreLabel = 'Xem thêm',
  moreTitle,
  className = 'customer-amenity-tags',
}) => {
  if (!items.length) return null;

  const limit = max ?? items.length;
  const visible = items.slice(0, limit);
  const hasMore = max != null && items.length > max;

  return (
    <div className={className}>
      {visible.map((item, index) => (
        <CustomerAmenityTag key={getItemKey(item, index)}>
          {getItemLabel(item)}
        </CustomerAmenityTag>
      ))}
      {hasMore && moreTo && (
        <CustomerAmenityTag to={moreTo} more title={moreTitle}>
          {moreLabel}
        </CustomerAmenityTag>
      )}
    </div>
  );
};

export default CustomerAmenityTags;
