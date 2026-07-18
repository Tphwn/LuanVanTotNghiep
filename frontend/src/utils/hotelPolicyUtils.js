export const REQUIRED_DOC_LABELS = {
  cccd: 'CCCD/CMND',
  ho_chieu: 'Hộ chiếu',
  gplx: 'Giấy phép lái xe',
  visa: 'Thị thực nhập cảnh',
};

export const parseGiayToBatBuoc = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
};

export const formatMoneyVnd = (value) => {
  if (value == null || value === '') return '';
  const raw = typeof value === 'object' && value !== null
    ? (value.toString?.() ?? String(value))
    : String(value);
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return `${Number(digits).toLocaleString('vi-VN')} VNĐ`;
};

export const buildAccommodationPolicyGroups = (hotel) => {
  const empty = { requirements: [], allowed: [], notAllowed: [], hasContent: false };
  if (!hotel) return empty;

  const requirements = [];
  const allowed = [];
  const notAllowed = [];

  const requiredDocs = parseGiayToBatBuoc(hotel.giay_to_bat_buoc)
    .map((docId) => REQUIRED_DOC_LABELS[docId] || docId);

  if (requiredDocs.length) {
    requirements.push(`Xuất trình giấy tờ: ${requiredDocs.join(', ')}`);
  }

  if (hotel.cho_phep_hut_thuoc) {
    allowed.push('Hút thuốc trong khu vực chỉ định');
  } else {
    notAllowed.push('Hút thuốc trong phòng và khu vực chung');
  }

  if (hotel.cho_phep_to_chuc_tiec) {
    allowed.push('Tổ chức tiệc / sự kiện (theo quy định khách sạn)');
  } else {
    notAllowed.push('Tổ chức tiệc / sự kiện');
  }

  if (hotel.cho_phep_thu_cung) {
    const petSurcharge = formatMoneyVnd(hotel.phu_thu_thu_cung);
    allowed.push(
      petSurcharge
        ? `Mang thú cưng (phụ thu ${petSurcharge}/đêm)`
        : 'Mang thú cưng',
    );
  } else {
    notAllowed.push('Mang thú cưng');
  }

  const freeAge = hotel.tuoi_toi_da_mien_phi;
  const childSurcharge = formatMoneyVnd(hotel.phu_thu_tre_em);
  const hasFreeAge = freeAge != null && freeAge !== '';

  if (hasFreeAge) {
    allowed.push(
      `Trẻ em từ ${freeAge} tuổi trở xuống: không phụ phí (ngủ chung giường sẵn có)`,
    );
    if (childSurcharge) {
      allowed.push(`Trẻ em trên ${freeAge} tuổi: phụ thu ${childSurcharge}/đêm`);
    }
  } else if (childSurcharge) {
    allowed.push(`Phụ thu trẻ em: ${childSurcharge}/đêm`);
  }

  const hasContent = requirements.length > 0 || allowed.length > 0 || notAllowed.length > 0;
  return { requirements, allowed, notAllowed, hasContent };
};

/** @deprecated Dùng buildAccommodationPolicyGroups */
export const buildAccommodationPolicyItems = (hotel) => {
  const { requirements, allowed, notAllowed } = buildAccommodationPolicyGroups(hotel);
  return [...requirements, ...allowed, ...notAllowed];
};

export const buildCancellationPolicyItems = (hotel) => {
  if (!hotel) return { rules: [], notes: [] };

  const rules = (hotel.chinh_sach_huy || [])
    .filter((p) => p.trang_thai === 'hoat_dong' || !p.trang_thai)
    .sort((a, b) => b.so_ngay_truoc - a.so_ngay_truoc)
    .map((p) => `Hủy trước ${p.so_ngay_truoc} ngày: hoàn ${Number(p.phan_tram_hoan)}% tiền đặt cọc`);

  return { rules, notes: [] };
};
