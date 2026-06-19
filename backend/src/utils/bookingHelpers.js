const prisma = require('../config/prisma');

const ACTIVE_BOOKING = ['cho_xac_nhan', 'da_xac_nhan'];

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDatesInRange = (checkIn, checkOut) => {
  const dates = [];
  const cur = new Date(checkIn);
  const end = new Date(checkOut);
  while (cur < end) {
    dates.push(new Date(cur).toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const countOverlappingBookings = async (maLoaiPhong, checkIn, checkOut) => {
  return prisma.dat_phong.count({
    where: {
      ma_loai_phong: maLoaiPhong,
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_nhan_phong: { lt: checkOut },
      ngay_tra_phong: { gt: checkIn },
    },
  });
};

const calcStayPrice = async (maLoaiPhong, giaCoBan, checkIn, checkOut) => {
  const base = Number(giaCoBan);
  if (!checkIn || !checkOut) {
    return { gia_tu_dem: base, tong_luong_tru: base, so_dem: 1 };
  }

  const dates = getDatesInRange(checkIn, checkOut);
  if (!dates.length) {
    return { gia_tu_dem: base, tong_luong_tru: base, so_dem: 1 };
  }

  const customPrices = await prisma.bang_gia_phong.findMany({
    where: {
      ma_loai_phong: maLoaiPhong,
      ngay: { gte: checkIn, lt: checkOut },
    },
  });

  const priceMap = customPrices.reduce((acc, row) => {
    acc[row.ngay.toISOString().slice(0, 10)] = Number(row.don_gia);
    return acc;
  }, {});

  let total = 0;
  for (const date of dates) {
    total += priceMap[date] ?? base;
  }

  return {
    gia_tu_dem: Math.round(total / dates.length),
    tong_luong_tru: total,
    so_dem: dates.length,
  };
};

module.exports = {
  ACTIVE_BOOKING,
  parseDate,
  getDatesInRange,
  countOverlappingBookings,
  calcStayPrice,
};
