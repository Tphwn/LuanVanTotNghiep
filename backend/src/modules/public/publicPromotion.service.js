const prisma = require('../../config/prisma');
const {
  syncExpiredPromotions,
  toLocalDateString,
} = require('../../utils/promotionRules');

const formatDiscountLabel = (promo) => {
  if (promo.loai_giam === 'phan_tram') {
    if (promo.giam_toi_da != null) {
      return `Giảm giá lên đến ${Number(promo.giam_toi_da).toLocaleString('vi-VN')} VND`;
    }
    return `Giảm giá ${Number(promo.gia_tri)}%`;
  }
  return `Giảm giá lên đến ${Number(promo.gia_tri).toLocaleString('vi-VN')} VND`;
};

const mapPublicPromotion = (promo) => ({
  ma_khuyen_mai: promo.ma_khuyen_mai,
  ma_code: promo.ma_code,
  ten: promo.ten,
  loai_giam: promo.loai_giam,
  gia_tri: Number(promo.gia_tri),
  giam_toi_da: promo.giam_toi_da != null ? Number(promo.giam_toi_da) : null,
  don_hang_toi_thieu: Number(promo.don_hang_toi_thieu || 0),
  ngay_bat_dau: promo.ngay_bat_dau,
  ngay_ket_thuc: promo.ngay_ket_thuc,
  discount_label: formatDiscountLabel(promo),
  mo_ta: promo.ten,
});

const getActiveWhere = (loaiNguon, maKhachSan = null) => {
  // So sánh theo ngày lịch (YYYY-MM-DD), không dùng Date local midnight để tránh lệch UTC+7
  const today = toLocalDateString();
  const where = {
    loai_nguon: loaiNguon,
    trang_thai: 'hoat_dong',
    khoa_boi_admin: false,
    khoa_boi_doi_tac: false,
    ngay_bat_dau: { lte: new Date(`${today}T00:00:00.000Z`) },
    ngay_ket_thuc: { gte: new Date(`${today}T00:00:00.000Z`) },
  };
  if (loaiNguon === 'he_thong') {
    where.ma_khach_san = null;
  } else if (maKhachSan) {
    where.ma_khach_san = Number(maKhachSan);
  }
  return where;
};

const isPromotionStillAvailable = (promo) => {
  if (promo.so_luot_toi_da == null) return true;
  return Number(promo.so_luot_da_dung) < Number(promo.so_luot_toi_da);
};

const getSystemPromotions = async () => {
  await syncExpiredPromotions(prisma, { loai_nguon: 'he_thong' });
  const rows = await prisma.khuyen_mai.findMany({
    where: getActiveWhere('he_thong'),
    orderBy: [{ gia_tri: 'desc' }, { ngay_ket_thuc: 'asc' }],
    take: 24,
  });
  return rows.filter(isPromotionStillAvailable).slice(0, 12).map(mapPublicPromotion);
};

const getHotelPromotions = async (maKhachSan) => {
  const hotelId = Number(maKhachSan);
  if (!hotelId) return [];

  const hotel = await prisma.khach_san.findFirst({
    where: { ma_khach_san: hotelId, trang_thai: 'hoat_dong' },
    select: { ma_khach_san: true },
  });
  if (!hotel) return [];

  await syncExpiredPromotions(prisma, {
    loai_nguon: 'doi_tac',
    ma_khach_san: hotelId,
  });

  const rows = await prisma.khuyen_mai.findMany({
    where: getActiveWhere('doi_tac', hotelId),
    orderBy: [{ gia_tri: 'desc' }, { ngay_ket_thuc: 'asc' }],
    take: 24,
  });
  return rows.filter(isPromotionStillAvailable).slice(0, 12).map(mapPublicPromotion);
};

module.exports = {
  getSystemPromotions,
  getHotelPromotions,
};
