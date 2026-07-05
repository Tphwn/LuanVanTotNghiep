const prisma = require('../config/prisma');

const ACTIVE_BOOKING = ['cho_xac_nhan', 'da_xac_nhan', 'da_checkin'];
const PENDING_CHECKIN_STATUS = ['cho_xac_nhan', 'da_xac_nhan'];
const AUTO_COMPLETE_MARKER = '[auto_hoan_thanh]';

const formatDateKey = (d) => {
  if (!d) return '';
  if (typeof d === 'string') {
    const part = d.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const part = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    return new Date(`${part}T00:00:00.000Z`);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDatesInRange = (checkIn, checkOut) => {
  const startKey = formatDateKey(checkIn);
  const endKey = formatDateKey(checkOut);
  if (!startKey || !endKey || startKey >= endKey) return [];

  const dates = [];
  let key = startKey;
  while (key < endKey) {
    dates.push(key);
    const cur = parseDate(key);
    const next = new Date(
      Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1),
    );
    key = formatDateKey(next);
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

/** Đếm đơn đang giữ phòng (chưa hủy / chưa hoàn thành, chưa trả phòng). */
const countActiveBookedRooms = async (maLoaiPhong) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.dat_phong.count({
    where: {
      ma_loai_phong: Number(maLoaiPhong),
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_tra_phong: { gte: today },
    },
  });
};

const calcRoomAvailability = (room, daDat) => {
  const tong = Number(room.so_luong_phong) || 0;
  const moBan = Number(room.so_luong_mo_ban) || 0;
  const phongConLai = Math.max(0, moBan - daDat);
  return { phong_con_lai: phongConLai, da_dat: daDat, so_luong_phong: tong };
};

const calcStayPrice = async (maLoaiPhong, giaCoBan, checkIn, checkOut) => {
  const base = Number(giaCoBan);
  if (!checkIn || !checkOut) {
    return {
      gia_tu_dem: base,
      gia_goc_dem: base,
      co_giam_gia: false,
      tong_luong_tru: base,
      tong_goc: base,
      so_dem: 1,
    };
  }

  const dates = getDatesInRange(checkIn, checkOut);
  if (!dates.length) {
    return {
      gia_tu_dem: base,
      gia_goc_dem: base,
      co_giam_gia: false,
      tong_luong_tru: base,
      tong_goc: base,
      so_dem: 1,
    };
  }

  const customPrices = dates.length
    ? await prisma.bang_gia_phong.findMany({
      where: {
        ma_loai_phong: Number(maLoaiPhong),
        ngay: { in: dates.map((date) => parseDate(date)) },
      },
    })
    : [];

  const priceMap = customPrices.reduce((acc, row) => {
    acc[formatDateKey(row.ngay)] = Number(row.don_gia);
    return acc;
  }, {});

  let total = 0;
  let totalBase = 0;
  for (const date of dates) {
    total += priceMap[date] ?? base;
    totalBase += base;
  }

  return {
    gia_tu_dem: Math.round(total / dates.length),
    gia_goc_dem: Math.round(totalBase / dates.length),
    co_giam_gia: total < totalBase,
    tong_luong_tru: total,
    tong_goc: totalBase,
    so_dem: dates.length,
  };
};

const isAutoCompletedBooking = (booking) =>
  Boolean(booking?.ghi_chu?.includes(AUTO_COMPLETE_MARKER));

const autoCompleteExpiredCheckIns = async (where = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expired = await prisma.dat_phong.findMany({
    where: {
      ...where,
      trang_thai: { in: PENDING_CHECKIN_STATUS },
      ngay_nhan_phong: { lt: today },
    },
  });

  if (!expired.length) return 0;

  await Promise.all(expired.map((booking) => {
    const ghiChu = booking.ghi_chu?.includes(AUTO_COMPLETE_MARKER)
      ? booking.ghi_chu
      : (booking.ghi_chu ? `${booking.ghi_chu}\n${AUTO_COMPLETE_MARKER}` : AUTO_COMPLETE_MARKER);

    return prisma.dat_phong.update({
      where: { ma_dat_phong: booking.ma_dat_phong },
      data: { trang_thai: 'hoan_thanh', ghi_chu: ghiChu },
    });
  }));

  return expired.length;
};

module.exports = {
  ACTIVE_BOOKING,
  PENDING_CHECKIN_STATUS,
  AUTO_COMPLETE_MARKER,
  parseDate,
  getDatesInRange,
  countOverlappingBookings,
  countActiveBookedRooms,
  calcRoomAvailability,
  calcStayPrice,
  isAutoCompletedBooking,
  autoCompleteExpiredCheckIns,
};
