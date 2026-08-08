/**
 * Validate partner bank account fields.
 * @returns {string|null} Error message or null if valid
 */
const validateBankAccount = ({
  so_tai_khoan,
  ten_chu_tai_khoan,
  ma_ngan_hang,
}) => {
  const tenChu = String(ten_chu_tai_khoan || '').trim();
  const soTk = String(so_tai_khoan || '').trim();
  const maNh = String(ma_ngan_hang || '').trim();

  if (!tenChu) {
    return 'Vui lòng nhập tên chủ tài khoản';
  }
  if (tenChu.length <= 2) {
    return 'Tên chủ tài khoản phải lớn hơn 2 ký tự';
  }

  if (!soTk) {
    return 'Vui lòng nhập số tài khoản';
  }
  if (!/^\d+$/.test(soTk)) {
    return 'Số tài khoản chỉ được chứa chữ số';
  }
  if (soTk.length <= 1) {
    return 'Số tài khoản phải lớn hơn 1 chữ số';
  }

  if (!maNh) {
    return 'Vui lòng chọn ngân hàng';
  }

  return null;
};

const hasCompleteBankAccount = (partner) => {
  if (!partner) return false;
  const soTk = String(partner.so_tai_khoan || '').trim();
  const tenChu = String(partner.ten_chu_tai_khoan || '').trim();
  const maNh = String(partner.ma_ngan_hang || '').trim();
  return Boolean(soTk && tenChu && maNh && soTk.length > 1 && tenChu.length > 2);
};

const mapBankAccount = (partner) => {
  if (!partner) {
    return {
      so_tai_khoan: null,
      ten_chu_tai_khoan: null,
      ma_ngan_hang: null,
      ten_ngan_hang: null,
      logo_ngan_hang: null,
      da_cap_nhat: false,
    };
  }
  return {
    so_tai_khoan: partner.so_tai_khoan || null,
    ten_chu_tai_khoan: partner.ten_chu_tai_khoan || null,
    ma_ngan_hang: partner.ma_ngan_hang || null,
    ten_ngan_hang: partner.ten_ngan_hang || null,
    logo_ngan_hang: partner.logo_ngan_hang || null,
    da_cap_nhat: hasCompleteBankAccount(partner),
  };
};
const parsePayoutProofNote = (ghiChu) => {
  const raw = String(ghiChu || '').trim();
  if (!raw) {
    return {
      ma_gd_ngan_hang: null,
      ky_thanh_toan: null,
      noi_dung_chuyen_khoan: null,
    };
  }
  const pick = (label) => {
    const re = new RegExp(`${label}:\\s*([^|]+)`, 'i');
    const m = raw.match(re);
    return m ? m[1].trim() : null;
  };
  return {
    ma_gd_ngan_hang: pick('Mã GD ngân hàng'),
    ky_thanh_toan: pick('Kỳ thanh toán'),
    noi_dung_chuyen_khoan: pick('Nội dung CK'),
  };
};

module.exports = {
  validateBankAccount,
  hasCompleteBankAccount,
  mapBankAccount,
  parsePayoutProofNote,
};
