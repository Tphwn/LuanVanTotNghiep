const prisma = require('../config/prisma');
const {
  assertPromotionApplicable,
  assertCustomerHasNotUsedPromotion,
  syncExpiredPromotions,
  decrementPromotionUsage,
  isCustomerFirstBooking,
  calculatePromotionDiscount,
  toLocalDateString,
} = require('./promotionRules');
const { calcFinalWithVat } = require('./stayPricing');

const formatDiscountLabel = (promo) => {
  if (promo.loai_giam === 'phan_tram') {
    if (promo.giam_toi_da != null) {
      return `Giảm giá lên đến ${Number(promo.giam_toi_da).toLocaleString('vi-VN')}đ`;
    }
    return `Giảm ${Number(promo.gia_tri)}%`;
  }
  return `Giảm ${Number(promo.gia_tri).toLocaleString('vi-VN')}đ`;
};

const resolveIsFirstBooking = async (maKhachHang, maDatPhong) => {
  if (maKhachHang == null) return true;
  return isCustomerFirstBooking(prisma, maKhachHang, maDatPhong);
};

const getHotelVatRate = async (maKhachSan) => {
  if (!maKhachSan) return 10;
  const policy = await prisma.chinh_sach_khach_san.findUnique({
    where: { ma_khach_san: Number(maKhachSan) },
    select: { phan_tram_vat: true },
  });
  const n = Number(policy?.phan_tram_vat);
  return Number.isFinite(n) ? n : 10;
};

/**
 * Áp mã khuyến mãi lên đơn đang chờ thanh toán online.
 * @param {object} booking — dat_phong kèm thanh_toan, loai_phong.ma_khach_san, khuyen_mai
 * @param {string} maCode
 * @param {number|null} maKhachHang
 */
const applyPromoOnBooking = async (booking, maCode, maKhachHang = null) => {
  const code = String(maCode || '').trim().toUpperCase();
  if (!code) {
    throw { statusCode: 400, message: 'Vui lòng nhập mã khuyến mãi' };
  }
  if (booking.khuyen_mai?.ma_code === code) {
    throw { statusCode: 400, message: `Mã ${code} đã được áp dụng cho đơn này` };
  }

  await syncExpiredPromotions(prisma);
  const promo = await prisma.khuyen_mai.findUnique({ where: { ma_code: code } });
  const tongTien = Number(booking.tong_tien_goc);
  const oldPromoId = booking.ma_khuyen_mai;
  const isFirstBooking = await resolveIsFirstBooking(maKhachHang, booking.ma_dat_phong);
  const vatRate = await getHotelVatRate(booking.loai_phong?.ma_khach_san);

  try {
    assertPromotionApplicable(promo, {
      maKhachSan: booking.loai_phong?.ma_khach_san,
      tongTien,
      isFirstBooking,
    });
    if (maKhachHang != null) {
      await assertCustomerHasNotUsedPromotion(prisma, {
        maKhachHang,
        maKhuyenMai: promo.ma_khuyen_mai,
        excludeMaDatPhong: booking.ma_dat_phong,
      });
    }
  } catch (err) {
    throw { statusCode: err.statusCode || 400, message: err.message };
  }

  await prisma.$transaction(async (tx) => {
    const freshPromo = await tx.khuyen_mai.findUnique({
      where: { ma_khuyen_mai: promo.ma_khuyen_mai },
    });
    const discount = assertPromotionApplicable(freshPromo, {
      maKhachSan: booking.loai_phong?.ma_khach_san,
      tongTien,
      isFirstBooking,
    });
    if (maKhachHang != null) {
      await assertCustomerHasNotUsedPromotion(tx, {
        maKhachHang,
        maKhuyenMai: promo.ma_khuyen_mai,
        excludeMaDatPhong: booking.ma_dat_phong,
      });
    }
    const { thanh_toan_cuoi: finalAmount } = calcFinalWithVat(tongTien, discount, vatRate);

    await tx.dat_phong.update({
      where: { ma_dat_phong: booking.ma_dat_phong },
      data: {
        ma_khuyen_mai: promo.ma_khuyen_mai,
        tien_giam: discount,
        thanh_toan_cuoi: finalAmount,
      },
    });

    if (booking.thanh_toan) {
      await tx.thanh_toan.update({
        where: { ma_thanh_toan: booking.thanh_toan.ma_thanh_toan },
        data: { so_tien: finalAmount },
      });
    }

    if (oldPromoId && oldPromoId !== promo.ma_khuyen_mai) {
      await decrementPromotionUsage(tx, oldPromoId);
    }
    if (!oldPromoId || oldPromoId !== promo.ma_khuyen_mai) {
      await tx.khuyen_mai.update({
        where: { ma_khuyen_mai: promo.ma_khuyen_mai },
        data: { so_luot_da_dung: { increment: 1 } },
      });
    }
  });
};

const removePromoOnBooking = async (booking) => {
  if (!booking.ma_khuyen_mai) {
    throw { statusCode: 400, message: 'Đơn chưa áp dụng mã khuyến mãi' };
  }

  const tongTien = Number(booking.tong_tien_goc);
  const oldPromoId = booking.ma_khuyen_mai;
  const vatRate = await getHotelVatRate(booking.loai_phong?.ma_khach_san);
  const { thanh_toan_cuoi: finalAmount } = calcFinalWithVat(tongTien, 0, vatRate);

  await prisma.$transaction(async (tx) => {
    await tx.dat_phong.update({
      where: { ma_dat_phong: booking.ma_dat_phong },
      data: {
        ma_khuyen_mai: null,
        tien_giam: 0,
        thanh_toan_cuoi: finalAmount,
      },
    });

    if (booking.thanh_toan) {
      await tx.thanh_toan.update({
        where: { ma_thanh_toan: booking.thanh_toan.ma_thanh_toan },
        data: { so_tien: finalAmount },
      });
    }

    await decrementPromotionUsage(tx, oldPromoId);
  });
};
// Lấy danh sách các mã khuyến mãi hợp lệ cho đơn đặt phòng
const listEligiblePromotionsForBooking = async (booking, maKhachHang = null) => {
  const maKhachSan = Number(booking.loai_phong?.ma_khach_san) || null;
  const tongTien = Number(booking.tong_tien_goc) || 0;
  const isFirstBooking = await resolveIsFirstBooking(maKhachHang, booking.ma_dat_phong);

  await syncExpiredPromotions(prisma);
  const today = toLocalDateString();
  const dayStart = new Date(`${today}T00:00:00.000Z`);

  const rows = await prisma.khuyen_mai.findMany({
    where: {
      trang_thai: 'hoat_dong',
      khoa_boi_admin: false,
      khoa_boi_doi_tac: false,
      ngay_bat_dau: { lte: dayStart },
      OR: [
        { loai_nguon: 'he_thong', ma_khach_san: null },
        ...(maKhachSan
          ? [{ loai_nguon: 'doi_tac', ma_khach_san: maKhachSan }]
          : []),
        { lan_dat_dau: true, loai_nguon: 'he_thong' },
      ],
    },
    orderBy: [{ gia_tri: 'desc' }, { ngay_ket_thuc: 'asc' }],
    take: 48,
  });

  const seen = new Set();
  const result = [];

  for (const promo of rows) {
    if (seen.has(promo.ma_khuyen_mai)) continue;
    seen.add(promo.ma_khuyen_mai);

    try {
      const discount = assertPromotionApplicable(promo, {
        maKhachSan,
        tongTien,
        isFirstBooking,
      });
      if (maKhachHang != null) {
        await assertCustomerHasNotUsedPromotion(prisma, {
          maKhachHang,
          maKhuyenMai: promo.ma_khuyen_mai,
          excludeMaDatPhong: booking.ma_dat_phong,
        });
      }
      result.push({
        ma_khuyen_mai: promo.ma_khuyen_mai,
        ma_code: promo.ma_code,
        ten: promo.ten,
        mo_ta: promo.ten,
        loai_giam: promo.loai_giam,
        gia_tri: Number(promo.gia_tri),
        giam_toi_da: promo.giam_toi_da != null ? Number(promo.giam_toi_da) : null,
        don_hang_toi_thieu: Number(promo.don_hang_toi_thieu || 0),
        ngay_ket_thuc: promo.ngay_ket_thuc,
        discount_label: formatDiscountLabel(promo),
        so_tien_giam: discount,
        dang_ap_dung: Number(booking.ma_khuyen_mai) === Number(promo.ma_khuyen_mai),
      });
    } catch {
    }
  }

  result.sort((a, b) => b.so_tien_giam - a.so_tien_giam);
  return result;
};

module.exports = {
  applyPromoOnBooking,
  removePromoOnBooking,
  listEligiblePromotionsForBooking,
  calculatePromotionDiscount,
  formatDiscountLabel,
  getHotelVatRate,
};
