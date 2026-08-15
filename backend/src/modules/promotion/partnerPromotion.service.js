const prisma = require('../../config/prisma');
const { Prisma } = require('@prisma/client');
const {
  assertPromotionFormValues,
  assertUniquePromotionCode,
  syncExpiredPromotions,
  publishPendingPartnerPromotions,
  isPastPromotionEndDate,
} = require('../../utils/promotionRules');

const resolvePublishStatus = (ngayKetThuc) => (
  isPastPromotionEndDate(ngayKetThuc) ? 'het_han' : 'hoat_dong'
);

const assertHotelOwnership = async (maKhachSan, doiTacId) => {
  const hotel = await prisma.khach_san.findFirst({
    where: {
      ma_khach_san: Number(maKhachSan),
      ma_doi_tac: doiTacId,
    },
    select: { ma_khach_san: true, ten: true },
  });
  if (!hotel) throw new Error('Không tìm thấy khách sạn hoặc không có quyền');
  return hotel;
};

const getPartnerHotelIds = async (doiTacId) => {
  const hotels = await prisma.khach_san.findMany({
    where: { ma_doi_tac: doiTacId },
    select: { ma_khach_san: true },
  });
  return hotels.map((h) => h.ma_khach_san);
};

const buildListWhere = (hotelIds, filters = {}) => {
  const { ma_khach_san, loai_giam, trang_thai, tu_ngay, den_ngay, keyword } = filters;
  const where = {
    loai_nguon: 'doi_tac',
    ma_khach_san: { in: hotelIds },
  };
  if (ma_khach_san) where.ma_khach_san = Number(ma_khach_san);
  if (loai_giam && loai_giam !== 'all') where.loai_giam = loai_giam;
  if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
  if (tu_ngay) where.ngay_ket_thuc = { gte: new Date(tu_ngay) };
  if (den_ngay) where.ngay_bat_dau = { lte: new Date(den_ngay) };
  if (keyword && String(keyword).trim()) {
    const kw = String(keyword).trim();
    where.OR = [
      { ma_code: { contains: kw } },
      { ten: { contains: kw } },
    ];
  }
  return where;
};

const enrichPartnerAuditFields = async (items) => {
  const list = Array.isArray(items) ? items : [items];
  if (!list.length) return items;

  const ids = list.map((i) => Number(i.ma_khuyen_mai));
  const rows = await prisma.$queryRaw`
    SELECT ma_khuyen_mai, khoa_boi_admin, khoa_boi_doi_tac, thoi_gian_khoa, ly_do
    FROM khuyen_mai
    WHERE ma_khuyen_mai IN (${Prisma.join(ids)})
  `;
  const map = new Map(rows.map((r) => [Number(r.ma_khuyen_mai), r]));

  const merged = list.map((item) => {
    const audit = map.get(Number(item.ma_khuyen_mai));
    if (!audit) return item;
    return {
      ...item,
      khoa_boi_admin: Boolean(audit.khoa_boi_admin),
      khoa_boi_doi_tac: Boolean(audit.khoa_boi_doi_tac),
      thoi_gian_khoa: audit.thoi_gian_khoa,
      ly_do: audit.ly_do ?? item.ly_do,
    };
  });

  return Array.isArray(items) ? merged : merged[0];
};

const getAuditFlags = async (id) => {
  const [row] = await prisma.$queryRaw`
    SELECT khoa_boi_admin, khoa_boi_doi_tac, trang_thai
    FROM khuyen_mai WHERE ma_khuyen_mai = ${Number(id)}
  `;
  return row || null;
};

const assertPartnerPromo = async (doiTacId, id) => {
  const hotelIds = await getPartnerHotelIds(doiTacId);
  const promo = await prisma.khuyen_mai.findFirst({
    where: {
      ma_khuyen_mai: Number(id),
      loai_nguon: 'doi_tac',
      ma_khach_san: { in: hotelIds },
    },
    include: { khach_san: { select: { ten: true, ma_khach_san: true } } },
  });
  if (!promo) throw new Error('Không tìm thấy khuyến mãi');
  return promo;
};

const computeStats = async (baseWhere) => {
  const [total, hoatDong, tuChoi, hetHan, an] = await Promise.all([
    prisma.khuyen_mai.count({ where: baseWhere }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'hoat_dong' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'tu_choi' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'het_han' } }),
    prisma.khuyen_mai.count({ where: { ...baseWhere, trang_thai: 'an' } }),
  ]);
  return {
    total, hoat_dong: hoatDong, tu_choi: tuChoi, het_han: hetHan, an,
  };
};

const partnerPromotionService = {
  getHotels: async (doiTacId) => {
    return prisma.khach_san.findMany({
      where: {
        ma_doi_tac: doiTacId,
        trang_thai: { in: ['da_duyet', 'hoat_dong'] },
      },
      select: { ma_khach_san: true, ten: true },
      orderBy: { ten: 'asc' },
    });
  },

  list: async (doiTacId, filters = {}) => {
    const hotelIds = await getPartnerHotelIds(doiTacId);
    if (!hotelIds.length) {
      return { data: [], stats: { total: 0, hoat_dong: 0, tu_choi: 0, het_han: 0, an: 0 } };
    }

    await publishPendingPartnerPromotions(prisma, {
      ma_khach_san: { in: hotelIds },
    });
    await syncExpiredPromotions(prisma, {
      loai_nguon: 'doi_tac',
      ma_khach_san: { in: hotelIds },
    });

    const baseWhere = buildListWhere(hotelIds, { ...filters, trang_thai: 'all' });
    const where = buildListWhere(hotelIds, filters);

    const [rows, stats] = await Promise.all([
      prisma.khuyen_mai.findMany({
        where,
        include: { khach_san: { select: { ten: true, ma_khach_san: true } } },
        orderBy: [{ trang_thai: 'asc' }, { ngay_bat_dau: 'desc' }, { ma_khuyen_mai: 'desc' }],
      }),
      computeStats(baseWhere),
    ]);

    return { data: await enrichPartnerAuditFields(rows), stats };
  },

  create: async (doiTacId, userId, payload) => {
    const {
      ma_khach_san,
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

    try {
      assertPromotionFormValues({
        ten,
        ma_code,
        loai_giam,
        gia_tri,
        giam_toi_da,
        don_hang_toi_thieu,
        ngay_bat_dau,
        ngay_ket_thuc,
        so_luot_toi_da,
        loai_nguon: 'doi_tac',
        ma_khach_san,
      }, { requireAll: true });
    } catch (err) {
      throw new Error(err.message);
    }

    if (!ma_khach_san || !loai_giam || gia_tri == null || !ngay_bat_dau || !ngay_ket_thuc) {
      throw new Error('Thiếu thông tin khuyến mãi bắt buộc');
    }

    await assertHotelOwnership(ma_khach_san, doiTacId);

    let code;
    try {
      code = await assertUniquePromotionCode(prisma, ma_code);
    } catch (err) {
      throw new Error(err.message);
    }

    const endDate = new Date(ngay_ket_thuc);
    const created = await prisma.khuyen_mai.create({
      data: {
        tao_boi_id: Number(userId),
        ma_khach_san: Number(ma_khach_san),
        ma_code: code,
        ten: String(ten).trim(),
        loai_nguon: 'doi_tac',
        loai_giam,
        gia_tri: Number(gia_tri),
        giam_toi_da: giam_toi_da != null && giam_toi_da !== '' ? Number(giam_toi_da) : null,
        don_hang_toi_thieu: Number(don_hang_toi_thieu || 0),
        ngay_bat_dau: new Date(ngay_bat_dau),
        ngay_ket_thuc: endDate,
        so_luot_toi_da: so_luot_toi_da != null && so_luot_toi_da !== '' ? Number(so_luot_toi_da) : null,
        trang_thai: resolvePublishStatus(endDate),
      },
      include: { khach_san: { select: { ten: true } } },
    });

    return enrichPartnerAuditFields(created);
  },

  update: async (doiTacId, maKhuyenMai, payload) => {
    const id = Number(maKhuyenMai);
    const promo = await assertPartnerPromo(doiTacId, id);
    const audit = await getAuditFlags(id);

    try {
      assertPromotionFormValues({
        ten: payload.ten != null ? payload.ten : promo.ten,
        ma_code: promo.ma_code,
        loai_giam: payload.loai_giam || promo.loai_giam,
        gia_tri: payload.gia_tri != null ? payload.gia_tri : promo.gia_tri,
        giam_toi_da: payload.giam_toi_da !== undefined ? payload.giam_toi_da : promo.giam_toi_da,
        don_hang_toi_thieu: payload.don_hang_toi_thieu != null ? payload.don_hang_toi_thieu : promo.don_hang_toi_thieu,
        ngay_bat_dau: payload.ngay_bat_dau || promo.ngay_bat_dau,
        ngay_ket_thuc: payload.ngay_ket_thuc || promo.ngay_ket_thuc,
        so_luot_toi_da: payload.so_luot_toi_da !== undefined ? payload.so_luot_toi_da : promo.so_luot_toi_da,
        loai_nguon: 'doi_tac',
        ma_khach_san: promo.ma_khach_san,
      }, { existingNgayBatDau: promo.ngay_bat_dau });
    } catch (err) {
      throw new Error(err.message);
    }

    const nextEnd = payload.ngay_ket_thuc ? new Date(payload.ngay_ket_thuc) : promo.ngay_ket_thuc;
    const stillLocked = Boolean(
      audit?.khoa_boi_admin
      || (audit?.khoa_boi_doi_tac && promo.trang_thai === 'an'),
    );

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
    if (payload.ngay_ket_thuc) data.ngay_ket_thuc = nextEnd;
    if (payload.so_luot_toi_da !== undefined) {
      data.so_luot_toi_da = payload.so_luot_toi_da != null && payload.so_luot_toi_da !== '' ? Number(payload.so_luot_toi_da) : null;
    }

    // Đang bị khóa (admin hoặc tự tạm ngưng): cho sửa nội dung, giữ trạng thái khóa
    if (!stillLocked) {
      data.trang_thai = resolvePublishStatus(nextEnd);
      if (data.trang_thai === 'hoat_dong') data.ly_do = null;
    }

    const updated = await prisma.khuyen_mai.update({
      where: { ma_khuyen_mai: id },
      data,
      include: { khach_san: { select: { ten: true } } },
    });

    return enrichPartnerAuditFields(updated);
  },

  lock: async (doiTacId, userId, maKhuyenMai, lyDo) => {
    const id = Number(maKhuyenMai);
    const promo = await assertPartnerPromo(doiTacId, id);
    const audit = await getAuditFlags(id);

    if (audit?.khoa_boi_admin) {
      throw new Error('Khuyến mãi đã bị admin khóa');
    }
    if (promo.trang_thai !== 'hoat_dong') {
      throw new Error('Chỉ có thể tạm ngưng khuyến mãi đang hoạt động');
    }
    if (!lyDo?.trim()) {
      throw new Error('Phải kèm lý do tạm ngưng');
    }

    const now = new Date();
    await prisma.$executeRaw`
      UPDATE khuyen_mai
      SET trang_thai = 'an',
          ly_do = ${lyDo.trim()},
          khoa_boi_doi_tac = TRUE,
          khoa_boi_admin = FALSE,
          khoa_boi_id = ${Number(userId)},
          thoi_gian_khoa = ${now},
          mo_khoa_boi_id = NULL,
          thoi_gian_mo_khoa = NULL
      WHERE ma_khuyen_mai = ${id}
    `;

    return enrichPartnerAuditFields(await assertPartnerPromo(doiTacId, id));
  },

  restore: async (doiTacId, userId, maKhuyenMai) => {
    const id = Number(maKhuyenMai);
    const promo = await assertPartnerPromo(doiTacId, id);
    const audit = await getAuditFlags(id);

    if (audit?.khoa_boi_admin) {
      throw new Error('Khuyến mãi đã bị admin khóa, không thể kích hoạt lại');
    }
    if (!audit?.khoa_boi_doi_tac || promo.trang_thai !== 'an') {
      throw new Error('Chỉ có thể kích hoạt lại khuyến mãi do bạn tạm ngưng');
    }

    const nextStatus = isPastPromotionEndDate(promo.ngay_ket_thuc) ? 'het_han' : 'hoat_dong';
    const now = new Date();

    await prisma.$executeRaw`
      UPDATE khuyen_mai
      SET trang_thai = ${nextStatus},
          ly_do = ${nextStatus === 'hoat_dong' ? null : promo.ly_do},
          khoa_boi_doi_tac = FALSE,
          mo_khoa_boi_id = ${Number(userId)},
          thoi_gian_mo_khoa = ${now}
      WHERE ma_khuyen_mai = ${id}
    `;

    return enrichPartnerAuditFields(await assertPartnerPromo(doiTacId, id));
  },
};

module.exports = partnerPromotionService;
