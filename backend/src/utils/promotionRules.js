
const toLocalDateString = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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

const EXPIRABLE_STATUSES = ['hoat_dong', 'cho_duyet', 'an'];

const isPastPromotionEndDate = (ngayKetThuc, at = new Date()) => (
  toDbDateString(ngayKetThuc) < toLocalDateString(at)
);

const FIRST_BOOKING_PROMO_END = '2099-12-31';

const syncExpiredPromotions = async (prismaClient, scopeWhere = {}) => {
  const today = toLocalDateString();
  const { count } = await prismaClient.khuyen_mai.updateMany({
    where: {
      ...scopeWhere,
      lan_dat_dau: false,
      trang_thai: { in: EXPIRABLE_STATUSES },
      ngay_ket_thuc: { lt: new Date(`${today}T00:00:00.000Z`) },
    },
    data: { trang_thai: 'het_han' },
  });
  return count;
};

const publishPendingPartnerPromotions = async (prismaClient, extraWhere = {}) => {
  const todayStart = new Date(`${toLocalDateString()}T00:00:00.000Z`);
  const pendingWhere = {
    loai_nguon: 'doi_tac',
    trang_thai: 'cho_duyet',
    ...extraWhere,
  };

  const expired = await prismaClient.khuyen_mai.updateMany({
    where: {
      ...pendingWhere,
      ngay_ket_thuc: { lt: todayStart },
    },
    data: { trang_thai: 'het_han', ly_do: null },
  });

  const active = await prismaClient.khuyen_mai.updateMany({
    where: {
      ...pendingWhere,
      ngay_ket_thuc: { gte: todayStart },
    },
    data: { trang_thai: 'hoat_dong', ly_do: null },
  });

  return { expired: expired.count, active: active.count };
};

const isCustomerFirstBooking = async (prismaClient, maKhachHang, excludeMaDatPhong = null) => {
  const where = { ma_khach_hang: Number(maKhachHang) };
  if (excludeMaDatPhong != null) {
    where.ma_dat_phong = { not: Number(excludeMaDatPhong) };
  }
  const count = await prismaClient.dat_phong.count({ where });
  return count === 0;
};

const findActiveFirstBookingPromo = async (prismaClient) => {
  await syncExpiredPromotions(prismaClient);
  return prismaClient.khuyen_mai.findFirst({
    where: {
      lan_dat_dau: true,
      loai_nguon: 'he_thong',
      trang_thai: 'hoat_dong',
      khoa_boi_admin: false,
      khoa_boi_doi_tac: false,
    },
    orderBy: { ma_khuyen_mai: 'desc' },
  });
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
      if (val > 50) throwValidation('Phần trăm giảm không được vượt quá 50%');
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

const assertPromotionApplicable = (promo, {
  maKhachSan,
  tongTien,
  at = new Date(),
  isFirstBooking = null,
} = {}) => {
  if (!promo) throwValidation('Mã khuyến mãi không tồn tại');

  if (promo.khoa_boi_admin) {
    throwValidation('Mã khuyến mãi đã bị khóa bởi quản trị viên, không thể áp dụng');
  }
  if (promo.khoa_boi_doi_tac) {
    throwValidation('Mã khuyến mãi đã bị khóa bởi đối tác, không thể áp dụng');
  }

  const isFirstOrderPromo = Boolean(promo.lan_dat_dau);

  if (!isFirstOrderPromo && isPastPromotionEndDate(promo.ngay_ket_thuc, at)) {
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
  if (!isFirstOrderPromo && today > end) {
    throwValidation('Mã khuyến mãi đã hết hạn');
  }

  if (isFirstOrderPromo && isFirstBooking === false) {
    throwValidation('Mã khuyến mãi chỉ áp dụng cho lần đặt phòng đầu tiên của bạn');
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

const decrementPromotionUsage = async (tx, maKhuyenMai) => {
  const id = Number(maKhuyenMai);
  if (!id || Number.isNaN(id)) return;
  await tx.$executeRaw`
    UPDATE khuyen_mai
    SET so_luot_da_dung = GREATEST(COALESCE(so_luot_da_dung, 0) - 1, 0)
    WHERE ma_khuyen_mai = ${id}
  `;
};

module.exports = {
  EXPIRABLE_STATUSES,
  BLOCKED_APPLY_STATUSES,
  FIRST_BOOKING_PROMO_END,
  toLocalDateString,
  toDbDateString,
  startOfDay,
  isPastPromotionEndDate,
  syncExpiredPromotions,
  publishPendingPartnerPromotions,
  isCustomerFirstBooking,
  findActiveFirstBookingPromo,
  assertPromotionFormValues,
  assertUniquePromotionCode,
  calculatePromotionDiscount,
  assertPromotionApplicable,
  assertCustomerHasNotUsedPromotion,
  decrementPromotionUsage,
};
