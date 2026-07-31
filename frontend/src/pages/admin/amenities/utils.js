import { resolveIconSlug } from '../../../utils/amenityIcons';

export const inferLoaiDeXuat = (req) => {
  if (req.loai_de_xuat) return req.loai_de_xuat;
  const moTa = (req.mo_ta || '').toLowerCase();
  if (moTa.includes('loại phòng') || moTa.includes('loai phong') || moTa.includes('[loại phòng:')) {
    return 'phong';
  }
  if (moTa.includes('khách sạn') || moTa.includes('khach san') || moTa.includes('[khách sạn:')) {
    return 'khach_san';
  }
  return null;
};

export const getPartnerRequestNote = (moTa) => {
  if (!moTa) return '';
  const cleaned = String(moTa)
    .replace(/\[khách sạn:[^\]]*\]\s*/gi, '')
    .replace(/\[loại phòng:[^\]]*\]\s*/gi, '')
    .replace(/Đối tác yêu cầu tiện nghi cho (khách sạn|loại phòng) này\.?/gi, '')
    .trim();
  return cleaned;
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

    const slug = resolveIconSlug(item.bieu_tuong, item.ten);
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
  const slug = resolveIconSlug(item.bieu_tuong, item.ten);
  const matched = categoryGroups.find((g) => g.slugs.length > 0 && g.slugs.includes(slug));
  if (matched) return matched.id;
  const catchAll = categoryGroups.find((g) => g.slugs.length === 0);
  return catchAll?.id || categoryGroups[0]?.id || null;
};

export const getCategoryLabel = (categoryId, categoryGroups = []) => {
  if (!categoryId) return '—';
  return categoryGroups.find((g) => g.id === categoryId)?.label || categoryId;
};

export const formatAmenityNameInput = (ten) => {
  const trimmed = String(ten || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.charAt(0).toLocaleUpperCase('vi') + trimmed.slice(1);
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

const AMENITY_ADDED_MARKER = '[[AMENITY_ADDED]]';

const normalizeAmenityText = (value) => (
  String(value || '')
    .trim()
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
);

export const extractAmenityProposalName = (proposal) => {
  const fromTitle = String(proposal?.tieu_de || '').match(/Đề xuất tiện nghi mới:\s*(.+)$/i);
  if (fromTitle?.[1]) return fromTitle[1].trim();
  const fromBody = String(proposal?.noi_dung || '').match(/đề xuất thêm tiện nghi\s+"([^"]+)"/i);
  return fromBody?.[1]?.trim() || '';
};

export const getAmenityProposalContent = (proposal) => (
  String(proposal?.noi_dung || '')
    .replace(AMENITY_ADDED_MARKER, '')
    .replace(/\n+/g, ' ')
    .trim()
);

/** Khớp đúng hoặc tên tiện nghi nằm trong câu đề xuất (vd: "Hướng biển" ⊂ "...view phòng hướng biển") */
const isAmenityNameMatched = (proposedName, amenityName) => {
  const proposed = normalizeAmenityText(proposedName);
  const amenity = normalizeAmenityText(amenityName);
  if (!proposed || !amenity) return false;
  if (proposed === amenity) return true;
  if (amenity.length >= 4 && proposed.includes(amenity)) return true;
  if (proposed.length >= 4 && amenity.includes(proposed)) return true;
  return false;
};

export const isAmenityProposalAdded = (proposal, amenities = []) => {
  if (String(proposal?.noi_dung || '').includes(AMENITY_ADDED_MARKER)) return true;
  const proposedName = extractAmenityProposalName(proposal);
  if (!proposedName) return false;
  return amenities.some((item) => isAmenityNameMatched(proposedName, item?.ten));
};
