const { parseJsonField } = require('./parseJson');

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

  if (body.hoan_khi_benh !== undefined) {
    rules.hoan_khi_benh = toBool(body.hoan_khi_benh);
  }
  if (body.hoan_cong_viec_dot_xuat !== undefined) {
    rules.hoan_cong_viec_dot_xuat = toBool(body.hoan_cong_viec_dot_xuat);
  }
  if (body.yeu_cau_minh_chung_huy !== undefined) {
    rules.yeu_cau_minh_chung_huy = toBool(body.yeu_cau_minh_chung_huy);
  }
  if (body.mo_ta_chinh_sach_huy !== undefined) {
    const val = String(body.mo_ta_chinh_sach_huy).trim();
    rules.mo_ta_chinh_sach_huy = val === '' ? null : val;
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
  parseHotelRulesInput,
  parseGiayToBatBuoc,
  parseNoiQuyKhac,
};
