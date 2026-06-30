import { suggestIconSlugFromName } from '../../../utils/amenityIcons';

export const inferLoaiDeXuat = (req) => {
  if (req.loai_de_xuat) return req.loai_de_xuat;
  const moTa = (req.mo_ta || '').toLowerCase();
  if (moTa.includes('loại phòng') || moTa.includes('loai phong')) return 'phong';
  if (moTa.includes('khách sạn') || moTa.includes('khach san')) return 'khach_san';
  return null;
};

export const groupAmenitiesByCategory = (items, categoryGroups) => {
  const groups = categoryGroups.map((g) => ({ ...g, items: [] }));
  const catchAll = groups.find((g) => g.slugs.length === 0);
  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]));

  items.forEach((item) => {
    if (item.danh_muc && groupById[item.danh_muc]) {
      groupById[item.danh_muc].items.push(item);
      return;
    }

    const slug = item.bieu_tuong || suggestIconSlugFromName(item.ten);
    let assigned = false;
    for (const g of groups) {
      if (g.slugs.length > 0 && g.slugs.includes(slug)) {
        g.items.push(item);
        assigned = true;
        break;
      }
    }
    if (!assigned && catchAll) catchAll.items.push(item);
  });
  return groups;
};

export const findCategoryForAmenity = (item, categoryGroups) => {
  if (!item) return categoryGroups[0]?.id || null;
  if (item.danh_muc && categoryGroups.some((g) => g.id === item.danh_muc)) {
    return item.danh_muc;
  }
  const slug = item.bieu_tuong || suggestIconSlugFromName(item.ten);
  const matched = categoryGroups.find((g) => g.slugs.length > 0 && g.slugs.includes(slug));
  if (matched) return matched.id;
  const catchAll = categoryGroups.find((g) => g.slugs.length === 0);
  return catchAll?.id || categoryGroups[0]?.id || null;
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
};
