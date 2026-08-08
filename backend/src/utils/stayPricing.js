const parseChildAges = (raw) => {
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((v) => Number(v.trim())).filter((n) => Number.isFinite(n) && n >= 0);
  }
  return [];
};

const calcChildSurcharge = ({
  tuoi_tre_em = [],
  tuoi_toi_da_mien_phi = null,
  phu_thu_tre_em = 0,
  so_dem = 0,
} = {}) => {
  const ages = parseChildAges(tuoi_tre_em);
  const freeMax = tuoi_toi_da_mien_phi == null || tuoi_toi_da_mien_phi === ''
    ? null
    : Number(tuoi_toi_da_mien_phi);
  const rate = Math.max(Number(phu_thu_tre_em) || 0, 0);
  const nights = Math.max(Number(so_dem) || 0, 0);

  let soTreTinhPhi = 0;
  ages.forEach((age) => {
    if (freeMax == null || Number(age) > freeMax) {
      soTreTinhPhi += 1;
    }
  });

  return {
    so_tre_em: ages.length,
    so_tre_tinh_phi: soTreTinhPhi,
    phu_thu_tre_em: soTreTinhPhi * rate * nights,
  };
};

/**
 * @param {object} input
 * @param {number} input.tien_phong - tổng tiền phòng (đã × số phòng, chưa VAT/phụ thu)
 * @param {number} input.so_dem
 * @param {number} [input.so_phong]
 * @param {number[]|string} [input.tuoi_tre_em]
 * @param {number|null} [input.tuoi_toi_da_mien_phi]
 * @param {number} [input.phu_thu_tre_em] - phụ thu / trẻ / đêm
 * @param {number} [input.phan_tram_vat]
 * @param {number} [input.tien_giam]
 */
const buildStayInvoice = ({
  tien_phong = 0,
  so_dem = 0,
  so_phong = 1,
  tuoi_tre_em = [],
  tuoi_toi_da_mien_phi = null,
  phu_thu_tre_em = 0,
  phan_tram_vat = 10,
  tien_giam = 0,
} = {}) => {
  const roomAmount = Math.max(Number(tien_phong) || 0, 0);
  const nights = Math.max(Number(so_dem) || 0, 0);
  const rooms = Math.max(Number(so_phong) || 1, 1);
  const discount = Math.max(Number(tien_giam) || 0, 0);
  const vatRate = Math.max(Number(phan_tram_vat) || 0, 0);

  const child = calcChildSurcharge({
    tuoi_tre_em,
    tuoi_toi_da_mien_phi,
    phu_thu_tre_em,
    so_dem: nights,
  });

  const tam_tinh = roomAmount + child.phu_thu_tre_em;
  const afterDiscount = Math.max(tam_tinh - discount, 0);
  const thue_vat = Math.round(afterDiscount * vatRate / 100);
  const thanh_toan_cuoi = afterDiscount + thue_vat;

  return {
    tien_phong: roomAmount,
    phu_thu_tre_em: child.phu_thu_tre_em,
    so_tre_em: child.so_tre_em,
    so_tre_tinh_phi: child.so_tre_tinh_phi,
    tam_tinh,
    tien_giam: discount,
    thue_vat,
    phan_tram_vat: vatRate,
    thanh_toan_cuoi,
    so_dem: nights,
    so_phong: rooms,
  };
};

const clampPercent = (value, fallback = 10) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
};

const priceWithVat = (amount, phanTramVat = 10) => {
  const base = Math.max(Number(amount) || 0, 0);
  const rate = clampPercent(phanTramVat, 10);
  return Math.round(base * (1 + rate / 100));
};

const calcFinalWithVat = (tongTienGoc, tienGiam, phanTramVat) => {
  const goc = Math.max(Number(tongTienGoc) || 0, 0);
  const giam = Math.max(Number(tienGiam) || 0, 0);
  const rate = clampPercent(phanTramVat, 10);
  const afterDiscount = Math.max(goc - giam, 0);
  const thue_vat = Math.round((afterDiscount * rate) / 100);
  return {
    after_discount: afterDiscount,
    thue_vat,
    phan_tram_vat: rate,
    thanh_toan_cuoi: afterDiscount + thue_vat,
  };
};

module.exports = {
  parseChildAges,
  calcChildSurcharge,
  buildStayInvoice,
  calcFinalWithVat,
  clampPercent,
  priceWithVat,
};
