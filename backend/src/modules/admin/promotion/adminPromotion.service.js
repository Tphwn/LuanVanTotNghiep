const prisma = require('../../../config/prisma');
const {
  notifyPromotionApproved,
  notifyPromotionRejected,
  notifyPromotionLocked,
  notifyPromotionUnlocked,
} = require('../../../utils/partnerNotify');

// nguoi_dung KHÔNG có cột ho_ten — tên người tạo lấy từ quan hệ doi_tac
// (ten_cong_ty) hoặc khach_hang (ho_ten), fallback về email.
const promotionInclude = {
  khach_san: {
    select: {
      ma_khach_san: true,
      ten: true,
      ma_doi_tac: true,
      doi_tac: { select: { ten_cong_ty: true } },
    },
  },
  nguoi_dung: {
    select: {
      ma_nguoi_dung: true,
      email: true,
      vai_tro: true,
      khach_hang: { select: { ho_ten: true } },
      doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: { select: { ten_cong_ty: true } },
    },
  },
};

const buildWhere = (filters = {}) => {
  const {
    loai_nguon, loai_giam, trang_thai, ma_khach_san, ma_doi_tac, keyword, tu_ngay, den_ngay,
  } = filters;
  const where = {};

  if (loai_nguon && loai_nguon !== 'all') where.loai_nguon = loai_nguon;
  if (loai_giam && loai_giam !== 'all') where.loai_giam = loai_giam;
  if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
  if (ma_khach_san) where.ma_khach_san = Number(ma_khach_san);
  // Lọc theo đối tác gián tiếp qua khách sạn (KM đối tác luôn gắn khách sạn)
  if (ma_doi_tac) where.khach_san = { ma_doi_tac: Number(ma_doi_tac) };

  // Lọc theo thời gian áp dụng: KM có khoảng thời gian giao với [tu_ngay, den_ngay]
  if (tu_ngay) where.ngay_ket_thuc = { gte: new Date(tu_ngay) };
  if (den_ngay) where.ngay_bat_dau = { lte: new Date(den_ngay) };

  if (keyword && keyword.trim()) {
    const kw = keyword.trim();
    where.OR = [
      { ma_code: { contains: kw } },
      { ten: { contains: kw } },
      { khach_san: { ten: { contains: kw } } },
    ];
  }

  return where;
};

const getNotifyContext = async (id) => prisma.khuyen_mai.findUnique({
  where: { ma_khuyen_mai: Number(id) },
  select: {
    ten: true,
    ma_code: true,
    loai_nguon: true,
    khach_san: { select: { ma_doi_tac: true } },
  },
});

const getPromotions = async (filters = {}) => {
  const where = buildWhere(filters);
  return prisma.khuyen_mai.findMany({
    where,
    include: promotionInclude,
    orderBy: [{ trang_thai: 'asc' }, { ngay_bat_dau: 'desc' }, { ma_khuyen_mai: 'desc' }],
  });
};

const getStats = async (filters = {}) => {
  const baseWhere = buildWhere({ ...filters, trang_thai: 'all' });
  const [total, choDuyet, hoatDong, tuChoi, hetHan, an] = await Promise.all([
    prisma.khuyen_mai.count({ where: baseWhere }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'cho_duyet' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'hoat_dong' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'tu_choi' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'het_han' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'an' } }),
  ]);
  return {
    total,
    cho_duyet: choDuyet,
    hoat_dong: hoatDong,
    tu_choi: tuChoi,
    het_han: hetHan,
    an,
  };
};

const getFilterPartners = async () => {
  const rows = await prisma.khuyen_mai.findMany({
    where: { ma_khach_san: { not: null } },
    select: { khach_san: { select: { ma_doi_tac: true } } },
  });
  const ids = [...new Set(rows.map((r) => r.khach_san?.ma_doi_tac).filter(Boolean))];
  if (!ids.length) return [];
  return prisma.doi_tac.findMany({
    where: { ma_doi_tac: { in: ids } },
    select: { ma_doi_tac: true, ten_cong_ty: true },
    orderBy: { ten_cong_ty: 'asc' },
  });
};

const getFilterHotels = async () => {
  const rows = await prisma.khuyen_mai.groupBy({
    by: ['ma_khach_san'],
    where: { ma_khach_san: { not: null } },
  });
  const ids = rows.map((r) => r.ma_khach_san).filter(Boolean);
  if (!ids.length) return [];
  return prisma.khach_san.findMany({
    where: { ma_khach_san: { in: ids } },
    select: { ma_khach_san: true, ten: true, ma_doi_tac: true },
    orderBy: { ten: 'asc' },
  });
};

const getPromotionById = async (id) => prisma.khuyen_mai.findUnique({
  where: { ma_khuyen_mai: Number(id) },
  include: promotionInclude,
});

// Ràng buộc giá trị dùng chung cho tạo/sửa (chặn cả khi gọi API trực tiếp)
const assertValidValues = ({
  loai_giam, gia_tri, giam_toi_da, don_hang_toi_thieu,
  ngay_bat_dau, ngay_ket_thuc, so_luot_toi_da,
}) => {
  const MIN_TIEN = 1000;
  const val = Number(gia_tri);
  if (Number.isNaN(val) || val <= 0) {
    throw { statusCode: 400, message: 'Giá trị giảm phải lớn hơn 0' };
  }
  if (loai_giam === 'phan_tram' && val > 100) {
    throw { statusCode: 400, message: 'Phần trăm giảm không được vượt quá 100%' };
  }
  if (loai_giam !== 'phan_tram' && val < MIN_TIEN) {
    throw { statusCode: 400, message: 'Số tiền giảm phải từ 1.000đ trở lên' };
  }
  if (giam_toi_da != null && giam_toi_da !== '' && Number(giam_toi_da) < MIN_TIEN) {
    throw { statusCode: 400, message: 'Giảm tối đa phải từ 1.000đ trở lên' };
  }
  if (don_hang_toi_thieu != null && don_hang_toi_thieu !== '') {
    const dh = Number(don_hang_toi_thieu);
    if (Number.isNaN(dh) || dh < 0) {
      throw { statusCode: 400, message: 'Đơn tối thiểu không hợp lệ' };
    }
    if (dh > 0 && dh < MIN_TIEN) {
      throw { statusCode: 400, message: 'Đơn tối thiểu phải từ 1.000đ trở lên' };
    }
  }
  if (ngay_bat_dau && ngay_ket_thuc && new Date(ngay_ket_thuc) <= new Date(ngay_bat_dau)) {
    throw { statusCode: 400, message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu' };
  }
  if (
    so_luot_toi_da != null && so_luot_toi_da !== ''
    && (!Number.isInteger(Number(so_luot_toi_da)) || Number(so_luot_toi_da) < 1)
  ) {
    throw { statusCode: 400, message: 'Số lượt tối đa phải là số nguyên ≥ 1' };
  }
};

const createSystemPromotion = async (userId, payload) => {
  const {
    ma_code,
    ten,
    loai_giam,
    gia_tri,
    giam_toi_da,
    don_hang_toi_thieu,
    ngay_bat_dau,
    ngay_ket_thuc,
    so_luot_toi_da,
  } = payload;

  if (!ma_code || !ten || !loai_giam || gia_tri == null || !ngay_bat_dau || !ngay_ket_thuc) {
    throw { statusCode: 400, message: 'Thiếu thông tin khuyến mãi bắt buộc' };
  }

  assertValidValues(payload);

  const code = String(ma_code).trim().toUpperCase();
  const existing = await prisma.khuyen_mai.findUnique({ where: { ma_code: code } });
  if (existing) throw { statusCode: 400, message: 'Mã khuyến mãi đã tồn tại' };

  return prisma.khuyen_mai.create({
    data: {
      tao_boi_id: Number(userId),
      ma_khach_san: null, 
      ma_code: code,
      ten: String(ten).trim(),
      loai_nguon: 'he_thong',
      loai_giam,
      gia_tri: Number(gia_tri),
      giam_toi_da: giam_toi_da != null ? Number(giam_toi_da) : null,
      don_hang_toi_thieu: Number(don_hang_toi_thieu || 0),
      ngay_bat_dau: new Date(ngay_bat_dau),
      ngay_ket_thuc: new Date(ngay_ket_thuc),
      so_luot_toi_da: so_luot_toi_da != null ? Number(so_luot_toi_da) : null,
      trang_thai: 'hoat_dong', 
    },
    include: promotionInclude,
  });
};

const updatePromotion = async (id, payload) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;

  assertValidValues({
    loai_giam: payload.loai_giam || promo.loai_giam,
    gia_tri: payload.gia_tri != null ? payload.gia_tri : promo.gia_tri,
    giam_toi_da: payload.giam_toi_da !== undefined ? payload.giam_toi_da : promo.giam_toi_da,
    don_hang_toi_thieu: payload.don_hang_toi_thieu != null ? payload.don_hang_toi_thieu : promo.don_hang_toi_thieu,
    ngay_bat_dau: payload.ngay_bat_dau || promo.ngay_bat_dau,
    ngay_ket_thuc: payload.ngay_ket_thuc || promo.ngay_ket_thuc,
    so_luot_toi_da: payload.so_luot_toi_da !== undefined ? payload.so_luot_toi_da : promo.so_luot_toi_da,
  });

  const data = {};
  if (payload.ten != null) data.ten = String(payload.ten).trim();
  if (payload.loai_giam) data.loai_giam = payload.loai_giam;
  if (payload.gia_tri != null) data.gia_tri = Number(payload.gia_tri);
  if (payload.giam_toi_da !== undefined) {
    data.giam_toi_da = payload.giam_toi_da != null ? Number(payload.giam_toi_da) : null;
  }
  if (payload.don_hang_toi_thieu != null) {
    data.don_hang_toi_thieu = Number(payload.don_hang_toi_thieu);
  }
  if (payload.ngay_bat_dau) data.ngay_bat_dau = new Date(payload.ngay_bat_dau);
  if (payload.ngay_ket_thuc) data.ngay_ket_thuc = new Date(payload.ngay_ket_thuc);
  if (payload.so_luot_toi_da !== undefined) {
    data.so_luot_toi_da = payload.so_luot_toi_da != null ? Number(payload.so_luot_toi_da) : null;
  }

  return prisma.khuyen_mai.update({
    where: { ma_khuyen_mai: Number(id) },
    data,
    include: promotionInclude,
  });
};
const lockPromotion = async (id, lyDo) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai === 'an') {
    return prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) }, include: promotionInclude });
  }

  const updated = await prisma.khuyen_mai.update({
    where: { ma_khuyen_mai: Number(id) },
    data: { trang_thai: 'an', ly_do: lyDo || null },
    include: promotionInclude,
  });

  const ctx = await getNotifyContext(id);
  if (ctx?.khach_san?.ma_doi_tac) {
    await notifyPromotionLocked(ctx.khach_san.ma_doi_tac, {
      tenKhuyenMai: ctx.ten, maCode: ctx.ma_code, lyDo,
    });
  }
  return updated;
};
const restorePromotion = async (id) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai === 'hoat_dong') {
    return prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) }, include: promotionInclude });
  }

  const updated = await prisma.khuyen_mai.update({
    where: { ma_khuyen_mai: Number(id) },
    data: { trang_thai: 'hoat_dong', ly_do: null },
    include: promotionInclude,
  });

  const ctx = await getNotifyContext(id);
  if (ctx?.khach_san?.ma_doi_tac) {
    await notifyPromotionUnlocked(ctx.khach_san.ma_doi_tac, {
      tenKhuyenMai: ctx.ten, maCode: ctx.ma_code,
    });
  }
  return updated;
};
const approvePromotion = async (id) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai !== 'cho_duyet') {
    throw { statusCode: 400, message: 'Chỉ duyệt được khuyến mãi đang chờ duyệt' };
  }

  const updated = await prisma.khuyen_mai.update({
    where: { ma_khuyen_mai: Number(id) },
    data: { trang_thai: 'hoat_dong', ly_do: null },
    include: promotionInclude,
  });

  const ctx = await getNotifyContext(id);
  if (ctx?.khach_san?.ma_doi_tac) {
    await notifyPromotionApproved(ctx.khach_san.ma_doi_tac, {
      tenKhuyenMai: ctx.ten, maCode: ctx.ma_code,
    });
  }
  return updated;
};

const rejectPromotion = async (id, lyDo) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai !== 'cho_duyet') {
    throw { statusCode: 400, message: 'Chỉ từ chối được khuyến mãi đang chờ duyệt' };
  }

  const updated = await prisma.khuyen_mai.update({
    where: { ma_khuyen_mai: Number(id) },
    data: { trang_thai: 'tu_choi', ly_do: lyDo || null },
    include: promotionInclude,
  });

  const ctx = await getNotifyContext(id);
  if (ctx?.khach_san?.ma_doi_tac) {
    await notifyPromotionRejected(ctx.khach_san.ma_doi_tac, {
      tenKhuyenMai: ctx.ten, maCode: ctx.ma_code, lyDo,
    });
  }
  return updated;
};

module.exports = {
  getPromotions,
  getStats,
  getFilterPartners,
  getFilterHotels,
  getPromotionById,
  createSystemPromotion,
  updatePromotion,
  lockPromotion,
  restorePromotion,
  approvePromotion,
  rejectPromotion,
};
