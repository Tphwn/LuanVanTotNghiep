const prisma = require('../config/prisma');
const { decrementPromotionUsage } = require('./promotionRules');

const CANCELLABLE_STATUS = ['cho_xac_nhan', 'da_xac_nhan'];
const PAY_HOLD_MS = 30 * 60 * 1000;


const purgeUnpaidBooking = async (tx, booking) => {
  const id = Number(booking.ma_dat_phong);
  if (booking.ma_khuyen_mai) {
    try {
      await decrementPromotionUsage(tx, booking.ma_khuyen_mai);
    } catch {
      /* ignore nếu không giảm được */
    }
  }
  await tx.hoan_tien.deleteMany({ where: { ma_dat_phong: id } });
  await tx.hoa_hong.deleteMany({ where: { ma_dat_phong: id } });
  await tx.thong_bao.deleteMany({ where: { ma_dat_phong: id } });
  await tx.danh_gia.deleteMany({ where: { ma_dat_phong: id } });
  await tx.bao_cao.updateMany({ where: { ma_dat_phong: id }, data: { ma_dat_phong: null } });
  await tx.thanh_toan.deleteMany({ where: { ma_dat_phong: id } });
  await tx.chi_tiet_dat_phong.deleteMany({ where: { ma_dat_phong: id } });
  await tx.dat_phong.delete({ where: { ma_dat_phong: id } });
};

/** Hết 30 phút chưa thanh toán → xóa đơn + giao dịch. */
const expireUnpaidOnlineHolds = async (arg1, arg2) => {
  let prismaClient = prisma;
  let scope = {};
  if (arg1 && typeof arg1.$transaction === 'function') {
    prismaClient = arg1;
    scope = arg2 || {};
  } else {
    scope = arg1 || {};
  }
  const { ma_khach_hang, ma_dat_phong } = scope;
  const cutoff = new Date(Date.now() - PAY_HOLD_MS);
  const where = {
    phuong_thuc_tt: 'truc_tuyen',
    trang_thai: { in: CANCELLABLE_STATUS },
    ngay_dat: { lt: cutoff },
    thanh_toan: { is: { trang_thai: { in: ['cho', 'that_bai'] } } },
  };
  if (ma_khach_hang) where.ma_khach_hang = Number(ma_khach_hang);
  if (ma_dat_phong) where.ma_dat_phong = Number(ma_dat_phong);

  const expired = await prismaClient.dat_phong.findMany({
    where,
    select: { ma_dat_phong: true, ma_khuyen_mai: true },
  });

  if (!expired.length) return 0;

  await prismaClient.$transaction(async (tx) => {
    for (const row of expired) {
      await purgeUnpaidBooking(tx, row);
    }
  });

  return expired.length;
};

const purgeCancelledUnpaidBookings = async (prismaClient = prisma, limit = 200) => {
  const rows = await prismaClient.dat_phong.findMany({
    where: {
      trang_thai: { in: ['da_huy', 'tu_choi'] },
      OR: [
        { thanh_toan: { is: { trang_thai: 'cho' } } },
        { thanh_toan: null },
      ],
    },
    select: { ma_dat_phong: true, ma_khuyen_mai: true },
    take: limit,
  });

  if (!rows.length) return 0;

  await prismaClient.$transaction(async (tx) => {
    for (const row of rows) {
      await purgeUnpaidBooking(tx, row);
    }
  });

  return rows.length;
};

module.exports = {
  PAY_HOLD_MS,
  purgeUnpaidBooking,
  expireUnpaidOnlineHolds,
  purgeCancelledUnpaidBookings,
};
