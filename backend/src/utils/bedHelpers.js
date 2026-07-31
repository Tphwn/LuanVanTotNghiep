const toNonNegInt = (val) => {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
};

const parseBedCounts = (data = {}) => {
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

const getBedSleepCapacity = (beds = {}) => {
  const { so_giuong_don: don, so_giuong_doi: doi, so_giuong_lon: lon } = parseBedCounts(beds);
  return don * 1 + doi * 2 + lon * 2;
};

/**
 * Ràng buộc: số người lớn (suc_chua) ≤ tổng chỗ ngủ từ giường.
 * Cho phép giường thừa chỗ.
 */
const validateBedsByCapacity = (soNguoiLon, beds) => {
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

const formatBedLabel = (roomOrBeds = {}) => {
  const { so_giuong_don: don, so_giuong_doi: doi, so_giuong_lon: lon, so_giuong } = parseBedCounts(roomOrBeds);
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

module.exports = {
  parseBedCounts,
  getBedSleepCapacity,
  validateBedsByCapacity,
  formatBedLabel,
};
