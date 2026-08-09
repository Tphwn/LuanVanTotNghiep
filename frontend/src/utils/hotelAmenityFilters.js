
export const HOTEL_AMENITY_CATEGORIES = [
  {
    id: 'dich_vu',
    label: 'Dịch vụ khách sạn',
    slugs: ['pool', 'gym', 'spa', 'massage', 'laundry', 'luggage', 'meeting', 'kids', 'pet', 'security', 'accessible', 'garden', 'beach', 'key'],
  },
  {
    id: 'cong_cong',
    label: 'Tiện nghi công cộng',
    slugs: ['elevator', 'wifi', 'parking', 'early_checkin', 'late_checkout'],
  },
  {
    id: 'lan_can',
    label: 'Các tiện ích lân cận',
    slugs: ['atm', 'shop'],
  },
  {
    id: 'van_chuyen',
    label: 'Vận chuyển',
    slugs: ['shuttle', 'car', 'bus'],
  },
  {
    id: 'am_thuc',
    label: 'Ẩm thực',
    slugs: ['restaurant', 'bar', 'breakfast', 'food', 'coffee', 'kitchen', 'minibar'],
  },
  {
    id: 'chung',
    label: 'Tiện nghi chung',
    slugs: ['safe', 'security', 'luggage', 'accessible', 'pet', 'elevator', 'laundry', 'smoke'],
  },
];

const suggestSlug = (name, bieuTuong) => {
  if (bieuTuong) return String(bieuTuong).trim().toLowerCase();
  if (!name) return 'wifi';
  const text = String(name).toLowerCase();
  if (text.includes('wifi')) return 'wifi';
  if (text.includes('bể') || text.includes('bơi')) return 'pool';
  if (text.includes('đỗ xe') || text.includes('bãi')) return 'parking';
  if (text.includes('nhà hàng')) return 'restaurant';
  if (text.includes('giặt')) return 'laundry';
  if (text.includes('thang máy')) return 'elevator';
  if (text.includes('đưa đón')) return 'shuttle';
  if (text.includes('cà phê')) return 'coffee';
  if (text.includes('trẻ em')) return 'kids';
  return 'wifi';
};

export const groupHotelAmenities = (items) => {
  const groups = HOTEL_AMENITY_CATEGORIES.map((g) => ({ ...g, items: [] }));
  const uncategorized = { id: 'khac', label: 'Khác', items: [] };

  items.forEach((item) => {
    const slug = suggestSlug(item.ten, item.bieu_tuong);
    const matched = groups.find((g) => g.slugs.includes(slug));
    if (matched) matched.items.push(item);
    else uncategorized.items.push(item);
  });

  const result = groups.filter((g) => g.items.length > 0);
  if (uncategorized.items.length > 0) result.push(uncategorized);
  return result;
};
