const prisma = require('../config/prisma');

const DEFAULT_COMMISSION_RATE = 15;

const COMMISSION_STATUS = {
  CHO_DOI_SOAT: 'chua_thu',
  DA_DOI_SOAT: 'da_thu',
  TAM_GIU: 'tam_giu',
  DA_THANH_TOAN: 'da_thanh_toan',
};

/** Có hoàn tiền đang chờ / đã hoàn → không tính hoa hồng */
const hasBlockingRefund = (hoanTien) => {
  if (!hoanTien) return false;
  return ['cho_xu_ly', 'dang_xu_ly', 'da_hoan'].includes(hoanTien.trang_thai);
};

const resolveCommissionRate = (hotel, partner) => {
  if (hotel?.phan_tram_hoa_hong != null && hotel.phan_tram_hoa_hong !== '') {
    return Number(hotel.phan_tram_hoa_hong);
  }
  if (partner?.phan_tram_hoa_hong != null && partner.phan_tram_hoa_hong !== '') {
    return Number(partner.phan_tram_hoa_hong);
  }
  return DEFAULT_COMMISSION_RATE;
};

/**
 * Chỉ cần: trạng thái hoàn thành + không bị hoàn tiền chặn + có đối tác.
 */
const isBookingEligibleForCommission = (booking) => {
  if (!booking || booking.trang_thai !== 'hoan_thanh') return false;
  if (hasBlockingRefund(booking.hoan_tien)) return false;
  const partnerId = booking.loai_phong?.khach_san?.ma_doi_tac;
  return Boolean(partnerId);
};

const loadBookingForCommission = async (maDatPhong, tx = prisma) => {
  return tx.dat_phong.findUnique({
    where: { ma_dat_phong: Number(maDatPhong) },
    include: {
      thanh_toan: true,
      hoan_tien: true,
      hoa_hong: true,
      loai_phong: {
        include: {
          khach_san: {
            include: {
              doi_tac: {
                select: {
                  ma_doi_tac: true,
                  phan_tram_hoa_hong: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

/**
 * Tạo bản ghi hoa hồng nếu đơn hoàn thành đủ điều kiện và chưa có.
 * @returns {Promise<object|null>}
 */
const ensureCommissionForBooking = async (maDatPhong, options = {}) => {
  const { tx = prisma } = options;
  const booking = await loadBookingForCommission(maDatPhong, tx);
  if (!booking) return null;
  if (booking.hoa_hong) return booking.hoa_hong;
  if (!isBookingEligibleForCommission(booking)) return null;

  const hotel = booking.loai_phong?.khach_san;
  const partner = hotel?.doi_tac;
  const maDoiTac = hotel?.ma_doi_tac || partner?.ma_doi_tac;
  if (!maDoiTac) return null;

  const tyLe = resolveCommissionRate(hotel, partner);
  const doanhThu = Number(booking.thanh_toan_cuoi) || 0;
  const soTien = Math.round((doanhThu * tyLe) / 100);

  try {
    return await tx.hoa_hong.create({
      data: {
        ma_dat_phong: booking.ma_dat_phong,
        ma_doi_tac: Number(maDoiTac),
        ty_le_hoa_hong: tyLe,
        so_tien_hoa_hong: soTien,
        trang_thai: COMMISSION_STATUS.CHO_DOI_SOAT,
      },
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return tx.hoa_hong.findUnique({ where: { ma_dat_phong: booking.ma_dat_phong } });
    }
    throw err;
  }
};

/**
 * Backfill hoa hồng cho mọi đơn hoàn thành chưa có bản ghi.
 */
const syncEligibleCommissions = async (limit = 500) => {
  const bookings = await prisma.dat_phong.findMany({
    where: {
      trang_thai: 'hoan_thanh',
      hoa_hong: null,
    },
    select: { ma_dat_phong: true },
    take: limit,
    orderBy: { ma_dat_phong: 'desc' },
  });

  let created = 0;
  for (const b of bookings) {
    try {
      const row = await ensureCommissionForBooking(b.ma_dat_phong);
      // Đã có sẵn cũng tính là đã đồng bộ (tránh bỏ sót khi đếm)
      if (row) created += 1;
    } catch (err) {
      console.error(`[commission] sync fail #${b.ma_dat_phong}:`, err.message);
    }
  }
  return created;
};

module.exports = {
  DEFAULT_COMMISSION_RATE,
  COMMISSION_STATUS,
  isBookingEligibleForCommission,
  ensureCommissionForBooking,
  syncEligibleCommissions,
  resolveCommissionRate,
};
