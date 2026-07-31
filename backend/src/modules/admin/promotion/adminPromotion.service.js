const prisma = require('../../../config/prisma');
const {
  notifyPromotionApproved,
  notifyPromotionRejected,
  notifyPromotionLocked,
  notifyPromotionUnlocked,
} = require('../../../utils/partnerNotify');
const {
  assertPromotionFormValues,
  assertUniquePromotionCode,
  syncExpiredPromotions,
  isPastPromotionEndDate,
  FIRST_BOOKING_PROMO_END,
} = require('../../../utils/promotionRules');
const { Prisma } = require('@prisma/client');

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
  if (ma_doi_tac) where.khach_san = { ma_doi_tac: Number(ma_doi_tac) };

  if (tu_ngay) where.ngay_ket_thuc = { gte: new Date(tu_ngay) };
  if (den_ngay) where.ngay_bat_dau = { lte: new Date(den_ngay) };

  if (keyword && keyword.trim()) {
    const kw = keyword.trim();
    where.OR = [
      { ma_code: { contains: kw } },
      { ten: { contains: kw } },
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

const enrichAuditFields = async (items) => {
  const list = Array.isArray(items) ? items : [items];
  if (!list.length) return items;

  const ids = list.map((i) => Number(i.ma_khuyen_mai));
  const rows = await prisma.$queryRaw`
    SELECT km.ma_khuyen_mai, km.khoa_boi_admin, km.khoa_boi_doi_tac, km.khoa_boi_id, km.thoi_gian_khoa,
           km.mo_khoa_boi_id, km.thoi_gian_mo_khoa,
           kb.email AS khoa_boi_email
    FROM khuyen_mai km
    LEFT JOIN nguoi_dung kb ON kb.ma_nguoi_dung = km.khoa_boi_id
    WHERE km.ma_khuyen_mai IN (${Prisma.join(ids)})
  `;
  const map = new Map(rows.map((r) => [Number(r.ma_khuyen_mai), r]));

  const merged = list.map((item) => {
    const audit = map.get(Number(item.ma_khuyen_mai));
    if (!audit) return item;
    return {
      ...item,
      khoa_boi_admin: Boolean(audit.khoa_boi_admin),
      khoa_boi_doi_tac: Boolean(audit.khoa_boi_doi_tac),
      khoa_boi_id: audit.khoa_boi_id,
      thoi_gian_khoa: audit.thoi_gian_khoa,
      mo_khoa_boi_id: audit.mo_khoa_boi_id,
      thoi_gian_mo_khoa: audit.thoi_gian_mo_khoa,
      khoa_boi: audit.khoa_boi_email ? { email: audit.khoa_boi_email } : null,
    };
  });

  return Array.isArray(items) ? merged : merged[0];
};

const getPromotions = async (filters = {}) => {
  await syncExpiredPromotions(prisma);
  const where = buildWhere(filters);
  const rows = await prisma.khuyen_mai.findMany({
    where,
    include: promotionInclude,
    orderBy: [{ trang_thai: 'asc' }, { ngay_bat_dau: 'desc' }, { ma_khuyen_mai: 'desc' }],
  });
  return enrichAuditFields(rows);
};

const getStats = async (filters = {}) => {
  await syncExpiredPromotions(prisma);
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

const getPromotionById = async (id) => {
  await syncExpiredPromotions(prisma);
  const row = await prisma.khuyen_mai.findUnique({
    where: { ma_khuyen_mai: Number(id) },
    include: promotionInclude,
  });
  if (!row) return null;
  return enrichAuditFields(row);
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
    lan_dat_dau = false,
  } = payload;

  const isFirstOrder = Boolean(lan_dat_dau);
  const endDate = isFirstOrder ? FIRST_BOOKING_PROMO_END : ngay_ket_thuc;

  assertPromotionFormValues({
    ten,
    ma_code,
    loai_giam,
    gia_tri,
    giam_toi_da,
    don_hang_toi_thieu,
    ngay_bat_dau,
    ngay_ket_thuc: endDate,
    so_luot_toi_da,
    loai_nguon: 'he_thong',
    ma_khach_san: null,
  }, { requireAll: true });

  if (!loai_giam || gia_tri == null || !ngay_bat_dau || !endDate) {
    throw { statusCode: 400, message: 'Thiếu thông tin khuyến mãi bắt buộc' };
  }

  const code = await assertUniquePromotionCode(prisma, ma_code);

  if (isFirstOrder) {
    await prisma.khuyen_mai.updateMany({
      where: { lan_dat_dau: true },
      data: { lan_dat_dau: false },
    });
  }

  return prisma.khuyen_mai.create({
    data: {
      tao_boi_id: Number(userId),
      ma_khach_san: null,
      ma_code: code,
      ten: String(ten).trim(),
      loai_nguon: 'he_thong',
      loai_giam,
      gia_tri: Number(gia_tri),
      giam_toi_da: giam_toi_da != null && giam_toi_da !== '' ? Number(giam_toi_da) : null,
      don_hang_toi_thieu: Number(don_hang_toi_thieu || 0),
      ngay_bat_dau: new Date(ngay_bat_dau),
      ngay_ket_thuc: new Date(endDate),
      lan_dat_dau: isFirstOrder,
      so_luot_toi_da: so_luot_toi_da != null && so_luot_toi_da !== '' ? Number(so_luot_toi_da) : null,
      trang_thai: 'hoat_dong',
    },
    include: promotionInclude,
  });
};

const updatePromotion = async (id, payload) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;

  const nextLanDatDau = payload.lan_dat_dau !== undefined
    ? Boolean(payload.lan_dat_dau)
    : Boolean(promo.lan_dat_dau);
  const nextEnd = nextLanDatDau
    ? FIRST_BOOKING_PROMO_END
    : (payload.ngay_ket_thuc || promo.ngay_ket_thuc);

  assertPromotionFormValues({
    ten: payload.ten != null ? payload.ten : promo.ten,
    ma_code: promo.ma_code,
    loai_giam: payload.loai_giam || promo.loai_giam,
    gia_tri: payload.gia_tri != null ? payload.gia_tri : promo.gia_tri,
    giam_toi_da: payload.giam_toi_da !== undefined ? payload.giam_toi_da : promo.giam_toi_da,
    don_hang_toi_thieu: payload.don_hang_toi_thieu != null ? payload.don_hang_toi_thieu : promo.don_hang_toi_thieu,
    ngay_bat_dau: payload.ngay_bat_dau || promo.ngay_bat_dau,
    ngay_ket_thuc: nextEnd,
    so_luot_toi_da: payload.so_luot_toi_da !== undefined ? payload.so_luot_toi_da : promo.so_luot_toi_da,
    loai_nguon: promo.loai_nguon,
    ma_khach_san: promo.ma_khach_san,
  }, { existingNgayBatDau: promo.ngay_bat_dau });

  if (nextLanDatDau && promo.loai_nguon !== 'he_thong') {
    throw { statusCode: 400, message: 'Chỉ khuyến mãi hệ thống mới gắn cờ lần đặt đầu' };
  }

  if (nextLanDatDau) {
    await prisma.khuyen_mai.updateMany({
      where: { lan_dat_dau: true, ma_khuyen_mai: { not: Number(id) } },
      data: { lan_dat_dau: false },
    });
  }

  const data = {};
  if (payload.ten != null) data.ten = String(payload.ten).trim();
  if (payload.loai_giam) data.loai_giam = payload.loai_giam;
  if (payload.gia_tri != null) data.gia_tri = Number(payload.gia_tri);
  if (payload.giam_toi_da !== undefined) {
    data.giam_toi_da = payload.giam_toi_da != null && payload.giam_toi_da !== '' ? Number(payload.giam_toi_da) : null;
  }
  if (payload.don_hang_toi_thieu != null) {
    data.don_hang_toi_thieu = Number(payload.don_hang_toi_thieu);
  }
  if (payload.ngay_bat_dau) data.ngay_bat_dau = new Date(payload.ngay_bat_dau);
  data.ngay_ket_thuc = new Date(nextEnd);
  data.lan_dat_dau = nextLanDatDau;
  if (payload.so_luot_toi_da !== undefined) {
    data.so_luot_toi_da = payload.so_luot_toi_da != null && payload.so_luot_toi_da !== '' ? Number(payload.so_luot_toi_da) : null;
  }

  return prisma.khuyen_mai.update({
    where: { ma_khuyen_mai: Number(id) },
    data,
    include: promotionInclude,
  });
};

const lockPromotion = async (id, adminUserId, lyDo) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai === 'an') {
    return getPromotionById(id);
  }

  const isPartnerPromo = promo.loai_nguon === 'doi_tac';
  const reason = (lyDo || '').trim();
  // Khóa KM đối tác bắt buộc có lý do; KM hệ thống (admin tạo) không cần
  if (isPartnerPromo && !reason) {
    throw { statusCode: 400, message: 'Phải kèm lý do tạm ngưng khuyến mãi đối tác' };
  }

  const now = new Date();

  await prisma.$executeRaw`
    UPDATE khuyen_mai
    SET trang_thai = 'an',
        ly_do = ${isPartnerPromo ? reason : null},
        khoa_boi_admin = ${isPartnerPromo},
        khoa_boi_doi_tac = FALSE,
        khoa_boi_id = ${Number(adminUserId)},
        thoi_gian_khoa = ${now},
        mo_khoa_boi_id = NULL,
        thoi_gian_mo_khoa = NULL
    WHERE ma_khuyen_mai = ${Number(id)}
  `;

  const updated = await getPromotionById(id);

  const ctx = await getNotifyContext(id);
  if (ctx?.khach_san?.ma_doi_tac) {
    await notifyPromotionLocked(ctx.khach_san.ma_doi_tac, {
      tenKhuyenMai: ctx.ten, maCode: ctx.ma_code, lyDo: reason || null,
    });
  }
  return updated;
};

const restorePromotion = async (id, adminUserId) => {
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai === 'hoat_dong') {
    return getPromotionById(id);
  }
  if (!['an', 'tu_choi'].includes(promo.trang_thai)) {
    throw { statusCode: 400, message: 'Không thể khôi phục khuyến mãi ở trạng thái hiện tại' };
  }

  const [audit] = await prisma.$queryRaw`
    SELECT khoa_boi_doi_tac FROM khuyen_mai WHERE ma_khuyen_mai = ${Number(id)}
  `;
  if (audit?.khoa_boi_doi_tac) {
    throw { statusCode: 400, message: 'Đối tác đã tạm ngưng khuyến mãi, admin không thể mở khóa' };
  }

  const nextStatus = isPastPromotionEndDate(promo.ngay_ket_thuc) ? 'het_han' : 'hoat_dong';
  const now = new Date();
  const nextLyDo = nextStatus === 'hoat_dong' ? null : promo.ly_do;

  await prisma.$executeRaw`
    UPDATE khuyen_mai
    SET trang_thai = ${nextStatus},
        ly_do = ${nextLyDo},
        khoa_boi_admin = FALSE,
        khoa_boi_doi_tac = FALSE,
        mo_khoa_boi_id = ${Number(adminUserId)},
        thoi_gian_mo_khoa = ${now}
    WHERE ma_khuyen_mai = ${Number(id)}
  `;

  const updated = await getPromotionById(id);

  const ctx = await getNotifyContext(id);
  if (ctx?.khach_san?.ma_doi_tac && nextStatus === 'hoat_dong') {
    await notifyPromotionUnlocked(ctx.khach_san.ma_doi_tac, {
      tenKhuyenMai: ctx.ten, maCode: ctx.ma_code,
    });
  }
  return updated;
};

const approvePromotion = async (id, adminUserId) => {
  await syncExpiredPromotions(prisma);
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_khuyen_mai: Number(id) } });
  if (!promo) return null;
  if (promo.trang_thai !== 'cho_duyet') {
    throw { statusCode: 400, message: 'Chỉ duyệt được khuyến mãi đang chờ duyệt' };
  }
  if (isPastPromotionEndDate(promo.ngay_ket_thuc)) {
    await prisma.khuyen_mai.update({
      where: { ma_khuyen_mai: Number(id) },
      data: { trang_thai: 'het_han' },
    });
    throw { statusCode: 400, message: 'Khuyến mãi đã hết hạn, không thể duyệt' };
  }

  const now = new Date();
  await prisma.$executeRaw`
    UPDATE khuyen_mai
    SET trang_thai = 'hoat_dong',
        ly_do = NULL,
        khoa_boi_doi_tac = FALSE,
        mo_khoa_boi_id = ${Number(adminUserId)},
        thoi_gian_mo_khoa = ${now}
    WHERE ma_khuyen_mai = ${Number(id)}
  `;

  const updated = await getPromotionById(id);

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
