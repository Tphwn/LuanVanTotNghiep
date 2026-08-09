const toNonNegInt = (val) => {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
};

export const parseBedCounts = (data = {}) => {
  const so_giuong_don = toNonNegInt(data.so_giuong_don);
  const so_giuong_doi = toNonNegInt(data.so_giuong_doi);
  const so_giuong_lon = toNonNegInt(data.so_giuong_lon);
  return {
    so_giuong_don,
    so_giuong_doi,
    so_giuong_lon,
    so_giuong: so_giuong_don + so_giuong_doi + so_giuong_lon,
  };
};

export const getBedSleepCapacity = (beds = {}) => {
  const { so_giuong_don: don, so_giuong_doi: doi, so_giuong_lon: lon } = parseBedCounts(beds);
  return don * 1 + doi * 2 + lon * 2;
};

export const validateBedsByCapacity = (soNguoiLon, beds) => {
  const adults = Number(soNguoiLon);
  if (!adults || adults < 1) return 'Số người lớn phải từ 1 trở lên';

  const parsed = parseBedCounts(beds);
  if (parsed.so_giuong < 1) return 'Vui lòng chọn ít nhất 1 giường';

  const sleepCap = getBedSleepCapacity(parsed);
  if (adults > sleepCap) {
    return `Số lượng giường không đủ đáp ứng cho ${adults} khách. Vui lòng thêm giường hoặc giảm số khách tối đa.`;
  }
  return null;
};

export const formatBedLabel = (roomOrBeds = {}) => {
  const {
    so_giuong_don: don,
    so_giuong_doi: doi,
    so_giuong_lon: lon,
    so_giuong,
  } = parseBedCounts(roomOrBeds);
  const items = [
    don > 0 ? { n: don, full: 'đơn', short: 'đơn' } : null,
    doi > 0 ? { n: doi, full: 'đôi', short: 'đôi' } : null,
    lon > 0 ? { n: lon, full: 'lớn', short: 'lớn' } : null,
  ].filter(Boolean);

  if (items.length === 0) {
    const total = Number(so_giuong) || 0;
    return total > 0 ? `${total} giường` : '—';
  }
  if (items.length === 1) {
    return `${items[0].n} giường ${items[0].full}`;
  }
  return items.map((i) => `${i.n} ${i.short}`).join(' + ');
};

export const BED_TYPE_OPTIONS = [
  { type: 'don', field: 'so_giuong_don', label: 'Single / Twin (giường đơn)', sleepCap: 1 },
  { type: 'doi', field: 'so_giuong_doi', label: 'Double (giường đôi)', sleepCap: 2 },
  { type: 'lon', field: 'so_giuong_lon', label: 'King / Queen (giường cỡ lớn)', sleepCap: 2 },
];

/** @deprecated dùng BED_TYPE_OPTIONS */
export const BED_TYPE_ROWS = BED_TYPE_OPTIONS.map((o) => ({
  key: o.field,
  label: o.label,
}));

export const bedsToRows = (beds = {}, { stamp = '' } = {}) => {
  const counts = parseBedCounts(beds);
  const rows = [];
  BED_TYPE_OPTIONS.forEach((opt) => {
    const qty = counts[opt.field];
    if (qty > 0) {
      rows.push({ type: opt.type, qty });
    }
  });
  if (rows.length === 0) {
    rows.push({ type: 'doi', qty: 1 });
  }
  return rows.map((row, idx) => ({
    ...row,
    id: `bed-${row.type}-${idx}${stamp ? `-${stamp}` : ''}`,
  }));
};

export const rowsToBeds = (rows = []) => {
  const result = { so_giuong_don: 0, so_giuong_doi: 0, so_giuong_lon: 0 };
  rows.forEach((row) => {
    const qty = Math.max(0, Math.floor(Number(row.qty) || 0));
    if (row.type === 'don') result.so_giuong_don += qty;
    if (row.type === 'doi') result.so_giuong_doi += qty;
    if (row.type === 'lon') result.so_giuong_lon += qty;
  });
  return {
    ...result,
    so_giuong: result.so_giuong_don + result.so_giuong_doi + result.so_giuong_lon,
  };
};
