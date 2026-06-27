const prisma = require('../config/prisma');

const ACTIVE_BOOKING = ['cho_xac_nhan', 'da_xac_nhan', 'da_checkin'];

const formatDateKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const part = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    const [y, m, d] = part.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDatesInRange = (checkIn, checkOut) => {
  const dates = [];
  const cur = new Date(checkIn);
  const end = new Date(checkOut);
  cur.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    dates.push(formatDateKey(cur));
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
    acc[formatDateKey(row.ngay)] = Number(row.don_gia);
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
