const { parseJsonField } = require('./parseJson');

const POLICY_FIELDS = [
  'giay_to_bat_buoc',
  'cho_phep_hut_thuoc',
  'cho_phep_to_chuc_tiec',
  'cho_phep_thu_cung',
  'phu_thu_thu_cung',
  'tuoi_toi_da_mien_phi',
  'phu_thu_tre_em',
  'phan_tram_vat',
  'noi_quy_khac',
];

const DEFAULT_POLICY = {
  giay_to_bat_buoc: null,
  cho_phep_hut_thuoc: false,
  cho_phep_to_chuc_tiec: false,
  cho_phep_thu_cung: false,
  phu_thu_thu_cung: null,
  tuoi_toi_da_mien_phi: null,
  phu_thu_tre_em: null,
  phan_tram_vat: 10,
  noi_quy_khac: null,
};

const toBool = (value) => value === true || value === 'true' || value === 1 || value === '1';

const parseMoneyInt = (value) => {
  const digits = String(value).trim().replace(/[^\d]/g, '');
  return digits === '' ? null : parseInt(digits, 10);
};

const parseHotelRulesInput = (body) => {
  const rules = {};

  if (body.giay_to_bat_buoc !== undefined) {
    const parsed = parseJsonField(body.giay_to_bat_buoc, []);
    const docs = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    rules.giay_to_bat_buoc = docs.length ? JSON.stringify(docs) : null;
  }

  if (body.cho_phep_hut_thuoc !== undefined) {
    rules.cho_phep_hut_thuoc = toBool(body.cho_phep_hut_thuoc);
  }
  if (body.cho_phep_to_chuc_tiec !== undefined) {
    rules.cho_phep_to_chuc_tiec = toBool(body.cho_phep_to_chuc_tiec);
  }
  if (body.cho_phep_thu_cung !== undefined) {
    rules.cho_phep_thu_cung = toBool(body.cho_phep_thu_cung);
  }

  if (body.phu_thu_thu_cung !== undefined) {
    rules.phu_thu_thu_cung = parseMoneyInt(body.phu_thu_thu_cung);
  }
  if (body.tuoi_toi_da_mien_phi !== undefined) {
    const val = String(body.tuoi_toi_da_mien_phi).trim();
    rules.tuoi_toi_da_mien_phi = val === '' ? null : parseInt(val, 10);
  }
  if (body.phu_thu_tre_em !== undefined) {
    rules.phu_thu_tre_em = parseMoneyInt(body.phu_thu_tre_em);
  }

  if (body.phan_tram_vat !== undefined) {
    const n = Number(body.phan_tram_vat);
    if (Number.isFinite(n)) {
      rules.phan_tram_vat = Math.min(100, Math.max(0, n));
    }
  }

  if (body.noi_quy_khac !== undefined) {
    const parsed = parseJsonField(body.noi_quy_khac, []);
    const list = Array.isArray(parsed)
      ? parsed.map((s) => String(s).trim()).filter(Boolean)
      : [];
    rules.noi_quy_khac = list.length ? JSON.stringify(list) : null;
  }

  return rules;
};

const flattenHotelPolicy = (hotel) => {
  if (!hotel) return hotel;
  const { chinh_sach_khach_san: policy, ...rest } = hotel;
  const src = policy || DEFAULT_POLICY;
  const flat = {};
  POLICY_FIELDS.forEach((key) => {
    flat[key] = src[key] ?? DEFAULT_POLICY[key];
  });
  return { ...rest, ...flat };
};

const flattenHotelsPolicy = (hotels = []) => hotels.map(flattenHotelPolicy);

const upsertHotelPolicy = async (tx, maKhachSan, rules = {}) => {
  const ma = Number(maKhachSan);
  return tx.chinh_sach_khach_san.upsert({
    where: { ma_khach_san: ma },
    create: {
      ma_khach_san: ma,
      ...DEFAULT_POLICY,
      ...rules,
    },
    update: { ...rules },
  });
};

const parseNoiQuyKhac = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(value).split('\n').map((s) => s.trim()).filter(Boolean);
  }
};

const parseGiayToBatBuoc = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
};

module.exports = {
  POLICY_FIELDS,
  DEFAULT_POLICY,
  parseHotelRulesInput,
  flattenHotelPolicy,
  flattenHotelsPolicy,
  upsertHotelPolicy,
  parseGiayToBatBuoc,
  parseNoiQuyKhac,
};
