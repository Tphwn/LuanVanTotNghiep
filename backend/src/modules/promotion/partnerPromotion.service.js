const prisma = require('../../config/prisma');

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

  list: async (doiTacId, { ma_khach_san } = {}) => {
    const hotelIds = await getPartnerHotelIds(doiTacId);
    if (!hotelIds.length) return [];

    const where = {
      loai_nguon: 'doi_tac',
      ma_khach_san: { in: hotelIds },
    };
    if (ma_khach_san) where.ma_khach_san = Number(ma_khach_san);

    return prisma.khuyen_mai.findMany({
      where,
      include: { khach_san: { select: { ten: true, ma_khach_san: true } } },
      orderBy: [{ ngay_bat_dau: 'desc' }, { ma_khuyen_mai: 'desc' }],
    });
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

    if (!ma_khach_san || !ma_code || !ten || !loai_giam || gia_tri == null) {
      throw new Error('Thiếu thông tin khuyến mãi bắt buộc');
    }

    await assertHotelOwnership(ma_khach_san, doiTacId);

    const existing = await prisma.khuyen_mai.findUnique({
      where: { ma_code: String(ma_code).trim().toUpperCase() },
    });
    if (existing) throw new Error('Mã khuyến mãi đã tồn tại');

    return prisma.khuyen_mai.create({
      data: {
        tao_boi_id: Number(userId),
        ma_khach_san: Number(ma_khach_san),
        ma_code: String(ma_code).trim().toUpperCase(),
        ten: String(ten).trim(),
        loai_nguon: 'doi_tac',
        loai_giam,
        gia_tri: Number(gia_tri),
        giam_toi_da: giam_toi_da != null ? Number(giam_toi_da) : null,
        don_hang_toi_thieu: Number(don_hang_toi_thieu || 0),
        ngay_bat_dau: new Date(ngay_bat_dau),
        ngay_ket_thuc: new Date(ngay_ket_thuc),
        so_luot_toi_da: so_luot_toi_da != null ? Number(so_luot_toi_da) : null,
        trang_thai: 'hoat_dong',
      },
      include: { khach_san: { select: { ten: true } } },
    });
  },

  update: async (doiTacId, maKhuyenMai, payload) => {
    const id = Number(maKhuyenMai);
    const hotelIds = await getPartnerHotelIds(doiTacId);

    const promo = await prisma.khuyen_mai.findFirst({
      where: {
        ma_khuyen_mai: id,
        loai_nguon: 'doi_tac',
        ma_khach_san: { in: hotelIds },
      },
    });
    if (!promo) throw new Error('Không tìm thấy khuyến mãi');

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
    if (payload.trang_thai) data.trang_thai = payload.trang_thai;

    return prisma.khuyen_mai.update({
      where: { ma_khuyen_mai: id },
      data,
      include: { khach_san: { select: { ten: true } } },
    });
  },
};

module.exports = partnerPromotionService;
