/** Ngày lịch (YYYY-MM-DD) theo giờ địa phương — tránh lệch múi giờ khi so với cột DATE. */
const toLocalDateString = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Ngày lịch từ cột @db.Date (Prisma trả về UTC midnight của ngày đó). */
const toDbDateString = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/** Trạng thái sẽ tự chuyển hết hạn khi qua ngày kết thúc (ngày kết thúc vẫn còn hiệu lực). */
const EXPIRABLE_STATUSES = ['hoat_dong', 'cho_duyet', 'an'];

const isPastPromotionEndDate = (ngayKetThuc, at = new Date()) => (
  toDbDateString(ngayKetThuc) < toLocalDateString(at)
);

/**
 * Cập nhật khuyến mãi quá hạn sang het_han.
 * VD: 1/7–10/7 → từ 11/7 trở đi là hết hạn.
 */
const syncExpiredPromotions = async (prismaClient, scopeWhere = {}) => {
  const today = toLocalDateString();
  const { count } = await prismaClient.khuyen_mai.updateMany({
    where: {
      ...scopeWhere,
      trang_thai: { in: EXPIRABLE_STATUSES },
      ngay_ket_thuc: { lt: new Date(`${today}T00:00:00.000Z`) },
    },
    data: { trang_thai: 'het_han' },
  });
  return count;
};

const BLOCKED_APPLY_STATUSES = ['an', 'het_han', 'cho_duyet', 'tu_choi'];

const throwValidation = (message) => {
  throw { statusCode: 400, message };
};

const assertPromotionFormValues = ({
  ten,
  ma_code,
  loai_giam,
  gia_tri,
  giam_toi_da,
  don_hang_toi_thieu,
  ngay_bat_dau,
  ngay_ket_thuc,
  so_luot_toi_da,
  loai_nguon,
  ma_khach_san,
}, { requireAll = false, existingNgayBatDau = null } = {}) => {
  if (requireAll || ten !== undefined) {
    if (!ten || !String(ten).trim()) throwValidation('Tên khuyến mãi không được để trống');
  }
  if (requireAll || ma_code !== undefined) {
    if (!ma_code || !String(ma_code).trim()) throwValidation('Mã khuyến mãi không được để trống');
  }

  if (loai_nguon !== undefined) {
    if (loai_nguon === 'he_thong' && ma_khach_san) {
      throwValidation('Khuyến mãi hệ thống không được gắn khách sạn cụ thể');
    }
    if (loai_nguon === 'doi_tac' && !ma_khach_san) {
      throwValidation('Phạm vi áp dụng phải chọn khách sạn hợp lệ');
    }
  }

  if (loai_giam != null && gia_tri != null) {
    const val = Number(gia_tri);
    if (Number.isNaN(val) || val <= 0) {
      throwValidation('Giá trị giảm phải lớn hơn 0');
    }
    if (loai_giam === 'phan_tram') {
      if (val > 100) throwValidation('Phần trăm giảm không được vượt quá 100%');
      if (giam_toi_da != null && giam_toi_da !== '') {
        const cap = Number(giam_toi_da);
        if (Number.isNaN(cap) || cap <= 0) {
          throwValidation('Giảm tối đa phải lớn hơn 0');
        }
      }
    } else if (val < 0) {
      throwValidation('Số tiền giảm không được âm');
    }
  }

  if (don_hang_toi_thieu != null && don_hang_toi_thieu !== '') {
    const dh = Number(don_hang_toi_thieu);
    if (Number.isNaN(dh) || dh < 0) throwValidation('Đơn tối thiểu không được âm');
  }

  if (ngay_bat_dau && ngay_ket_thuc) {
    const start = String(ngay_bat_dau).slice(0, 10);
    const end = String(ngay_ket_thuc).slice(0, 10);
    if (end < start) {
      throwValidation('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
    }
  }

  const today = toLocalDateString();
  const existingStart = existingNgayBatDau ? toDbDateString(existingNgayBatDau) : null;

  if (ngay_bat_dau) {
    const start = String(ngay_bat_dau).slice(0, 10);
    // Tạo mới: không cho quá khứ. Sửa: chỉ cho giữ ngày bắt đầu cũ nếu đã qua.
    if (start < today && start !== existingStart) {
      throwValidation('Ngày bắt đầu không được nằm trong quá khứ');
    }
  }
  if (ngay_ket_thuc) {
    const end = String(ngay_ket_thuc).slice(0, 10);
    if (end < today) {
      throwValidation('Ngày kết thúc không được nằm trong quá khứ');
    }
  }

  if (so_luot_toi_da != null && so_luot_toi_da !== '') {
    if (!Number.isInteger(Number(so_luot_toi_da)) || Number(so_luot_toi_da) < 1) {
      throwValidation('Số lượt tối đa phải lớn hơn 0');
    }
  }
};

const assertUniquePromotionCode = async (prisma, code, excludeId = null) => {
  const normalized = String(code).trim().toUpperCase();
  const existing = await prisma.khuyen_mai.findUnique({ where: { ma_code: normalized } });
  if (existing && (!excludeId || existing.ma_khuyen_mai !== Number(excludeId))) {
    throwValidation('Mã khuyến mãi đã tồn tại');
  }
  return normalized;
};

const calculatePromotionDiscount = (promo, orderTotal) => {
  const total = Number(orderTotal);
  if (!total || total <= 0) return 0;

  let discount = 0;
  if (promo.loai_giam === 'phan_tram') {
    discount = Math.round(total * Number(promo.gia_tri) / 100);
    if (promo.giam_toi_da != null) {
      discount = Math.min(discount, Number(promo.giam_toi_da));
    }
  } else {
    discount = Math.round(Number(promo.gia_tri));
    discount = Math.min(discount, total);
  }

  return Math.max(0, discount);
};

const assertPromotionApplicable = (promo, { maKhachSan, tongTien, at = new Date() }) => {
  if (!promo) throwValidation('Mã khuyến mãi không tồn tại');

  if (promo.khoa_boi_admin) {
    throwValidation('Mã khuyến mãi đã bị khóa bởi quản trị viên, không thể áp dụng');
  }
  if (promo.khoa_boi_doi_tac) {
    throwValidation('Mã khuyến mãi đã bị khóa bởi đối tác, không thể áp dụng');
  }

  if (isPastPromotionEndDate(promo.ngay_ket_thuc, at)) {
    throwValidation('Mã khuyến mãi đã hết hạn');
  }

  if (promo.trang_thai === 'het_han') {
    throwValidation('Mã khuyến mãi đã hết hạn');
  }
  if (promo.trang_thai === 'an') {
    throwValidation('Mã khuyến mãi đang bị khóa / tạm ngưng, không thể áp dụng');
  }
  if (BLOCKED_APPLY_STATUSES.includes(promo.trang_thai)) {
    throwValidation('Mã khuyến mãi không khả dụng (chưa duyệt, bị từ chối hoặc tạm ngưng)');
  }
  if (promo.trang_thai !== 'hoat_dong') {
    throwValidation('Mã khuyến mãi hiện không thể áp dụng');
  }

  const today = toLocalDateString(at);
  const start = toDbDateString(promo.ngay_bat_dau);
  const end = toDbDateString(promo.ngay_ket_thuc);
  if (today < start) {
    throwValidation('Mã khuyến mãi chưa đến thời gian áp dụng');
  }
  if (today > end) {
    throwValidation('Mã khuyến mãi đã hết hạn');
  }

  if (promo.loai_nguon === 'doi_tac') {
    if (!promo.ma_khach_san || Number(promo.ma_khach_san) !== Number(maKhachSan)) {
      throwValidation('Mã khuyến mãi không áp dụng cho khách sạn này');
    }
  }

  const orderTotal = Number(tongTien) || 0;
  const minOrder = Number(promo.don_hang_toi_thieu || 0);
  if (minOrder > 0 && orderTotal < minOrder) {
    throwValidation(
      `Đơn phòng hiện tại (${orderTotal.toLocaleString('vi-VN')}đ) chưa đạt mức tối thiểu `
      + `${minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này`
    );
  }

  if (promo.so_luot_toi_da != null && Number(promo.so_luot_da_dung) >= Number(promo.so_luot_toi_da)) {
    throwValidation('Mã khuyến mãi đã hết lượt sử dụng');
  }

  const discount = calculatePromotionDiscount(promo, orderTotal);
  if (discount <= 0) {
    throwValidation('Khuyến mãi không áp dụng được cho đơn này');
  }

  return discount;
};

const assertCustomerHasNotUsedPromotion = async (
  prismaClient,
  { maKhachHang, maKhuyenMai, excludeMaDatPhong = null }
) => {
  const where = {
    ma_khach_hang: Number(maKhachHang),
    ma_khuyen_mai: Number(maKhuyenMai),
    trang_thai: { notIn: ['da_huy', 'tu_choi'] },
    OR: [
      { thanh_toan: { is: { trang_thai: 'thanh_cong' } } },
      { phuong_thuc_tt: 'tai_khach_san' },
    ],
  };
  if (excludeMaDatPhong != null) {
    where.ma_dat_phong = { not: Number(excludeMaDatPhong) };
  }

  const used = await prismaClient.dat_phong.findFirst({
    where,
    select: { ma_dat_phong: true, ma_don_hang: true },
    orderBy: { ma_dat_phong: 'desc' },
  });

  if (used) {
    const orderRef = used.ma_don_hang || `#${used.ma_dat_phong}`;
    throwValidation(
      `Bạn đã dùng mã này cho đơn ${orderRef}`
      + 'Vui lòng chọn mã khuyến mãi khác cho đơn này'
    );
  }
};

module.exports = {
  EXPIRABLE_STATUSES,
  BLOCKED_APPLY_STATUSES,
  toLocalDateString,
  toDbDateString,
  startOfDay,
  isPastPromotionEndDate,
  syncExpiredPromotions,
  assertPromotionFormValues,
  assertUniquePromotionCode,
  calculatePromotionDiscount,
  assertPromotionApplicable,
  assertCustomerHasNotUsedPromotion,
};
