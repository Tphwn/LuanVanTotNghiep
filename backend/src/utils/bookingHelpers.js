const prisma = require('../config/prisma');
const { ensureCommissionForBooking } = require('./commissionHelpers');

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
// Lấy danh sách các ngày trong khoảng thời gian
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
// Đếm số lượng booking trùng lặp
const countOverlappingBookings = async (maLoaiPhong, checkIn, checkOut) => {
  const result = await prisma.dat_phong.aggregate({
    where: {
      ma_loai_phong: maLoaiPhong,
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_nhan_phong: { lt: checkOut },
      ngay_tra_phong: { gt: checkIn },
    },
    _sum: { so_phong: true },
  });
  return Number(result._sum.so_phong) || 0;
};
// Đếm số lượng phòng đã đặt
const countActiveBookedRooms = async (maLoaiPhong) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = await prisma.dat_phong.aggregate({
    where: {
      ma_loai_phong: Number(maLoaiPhong),
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_tra_phong: { gte: today },
    },
    _sum: { so_phong: true },
  });
  return Number(result._sum.so_phong) || 0;
};

const countActiveBookedRoomsMap = async (maLoaiPhongList = []) => {
  const ids = [...new Set((maLoaiPhongList || []).map((id) => Number(id)).filter(Boolean))];
  const result = new Map();
  if (!ids.length) return result;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = await prisma.dat_phong.groupBy({
    by: ['ma_loai_phong'],
    where: {
      ma_loai_phong: { in: ids },
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_tra_phong: { gte: today },
    },
    _sum: { so_phong: true },
  });

  grouped.forEach((row) => {
    result.set(row.ma_loai_phong, Number(row._sum.so_phong) || 0);
  });
  return result;
};
// Tính số lượng phòng còn lại
const calcRoomAvailability = (room, daDat) => {
  const tong = Number(room.so_luong_phong) || 0;
  const moBan = Number(room.so_luong_mo_ban) || 0;
  const phongConLai = Math.max(0, moBan - daDat);
  return { phong_con_lai: phongConLai, da_dat: daDat, so_luong_phong: tong };
};

const buildEmptyStayPrice = (base, roomCount = 1) => ({
  gia_tu_dem: base,
  gia_goc_dem: base,
  co_giam_gia: false,
  la_gia_trung_binh: false,
  tong_luong_tru: base,
  tong_goc: base,
  tong_luong_tru_tat_ca: base * roomCount,
  so_dem: 1,
  so_phong: roomCount,
  phong_gia_khuyen_mai_con: null,
  chi_tiet_dem: [],
});

const fetchNightPricingContext = async (maLoaiPhong, checkIn, checkOut) => {
  const dates = getDatesInRange(checkIn, checkOut);
  if (!dates.length) {
    return { dates: [], priceMap: new Map(), bookedByNight: {} };
  }

  const customPrices = await prisma.bang_gia_phong.findMany({
    where: {
      ma_loai_phong: Number(maLoaiPhong),
      ngay: { in: dates.map((date) => parseDate(date)) },
    },
  });

  const priceMap = new Map();
  customPrices.forEach((row) => {
    priceMap.set(formatDateKey(row.ngay), {
      don_gia: Number(row.don_gia),
      so_luong_ap_dung: row.so_luong_ap_dung != null ? Number(row.so_luong_ap_dung) : null,
    });
  });

  const bookings = await prisma.dat_phong.findMany({
    where: {
      ma_loai_phong: Number(maLoaiPhong),
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_nhan_phong: { lt: checkOut },
      ngay_tra_phong: { gt: checkIn },
    },
    select: { ngay_nhan_phong: true, ngay_tra_phong: true, so_phong: true },
  });

  const bookedByNight = {};
  dates.forEach((dateKey) => {
    const nightStart = parseDate(dateKey);
    let booked = 0;
    bookings.forEach((booking) => {
      const checkInKey = formatDateKey(booking.ngay_nhan_phong);
      const checkOutKey = formatDateKey(booking.ngay_tra_phong);
      if (dateKey >= checkInKey && dateKey < checkOutKey) {
        booked += Number(booking.so_phong) || 0;
      }
    });
    bookedByNight[dateKey] = booked;
  });

  return { dates, priceMap, bookedByNight };
};

const computeNightAllocation = (priceRow, base, roomCount, bookedOnNight) => {
  const hasCustom = priceRow != null;
  const customPrice = hasCustom ? priceRow.don_gia : base;
  const isDiscount = hasCustom && customPrice < base;

  if (!isDiscount || priceRow.so_luong_ap_dung == null) {
    const unitPrice = hasCustom ? customPrice : base;
    return {
      so_phong_giam_gia: isDiscount ? roomCount : 0,
      so_phong_gia_goc: isDiscount ? 0 : roomCount,
      don_gia_giam: isDiscount ? customPrice : null,
      don_gia_goc: base,
      tong_dem: unitPrice * roomCount,
      tong_goc_dem: base * roomCount,
      quota_con_lai: null,
    };
  }

  const quotaRemaining = Math.max(0, priceRow.so_luong_ap_dung - bookedOnNight);
  const discountRooms = Math.min(roomCount, quotaRemaining);
  const fullRooms = roomCount - discountRooms;

  return {
    so_phong_giam_gia: discountRooms,
    so_phong_gia_goc: fullRooms,
    don_gia_giam: customPrice,
    don_gia_goc: base,
    tong_dem: (discountRooms * customPrice) + (fullRooms * base),
    tong_goc_dem: base * roomCount,
    quota_con_lai: quotaRemaining,
  };
};

// Tính giá phòng (hỗ trợ quota giảm giá theo ngày)
const calcStayPrice = async (maLoaiPhong, giaCoBan, checkIn, checkOut, roomCount = 1) => {
  const base = Number(giaCoBan);
  const rooms = Math.max(Number(roomCount) || 1, 1);

  if (!checkIn || !checkOut) {
    return buildEmptyStayPrice(base, rooms);
  }

  const ctx = await fetchNightPricingContext(maLoaiPhong, checkIn, checkOut);
  if (!ctx.dates.length) {
    return buildEmptyStayPrice(base, rooms);
  }

  let totalAll = 0;
  let totalBaseAll = 0;
  let laGiaTrungBinh = false;
  let minQuotaRemaining = Infinity;
  let hasPromoQuota = false;
  const chiTietDem = [];

  ctx.dates.forEach((dateKey) => {
    const priceRow = ctx.priceMap.get(dateKey) || null;
    const booked = ctx.bookedByNight[dateKey] || 0;
    const night = computeNightAllocation(priceRow, base, rooms, booked);

    totalAll += night.tong_dem;
    totalBaseAll += night.tong_goc_dem;

    if (night.so_phong_giam_gia > 0 && night.so_phong_gia_goc > 0) {
      laGiaTrungBinh = true;
    }

    if (
      priceRow?.so_luong_ap_dung != null
      && priceRow.don_gia < base
    ) {
      hasPromoQuota = true;
      minQuotaRemaining = Math.min(minQuotaRemaining, night.quota_con_lai);
    }

    chiTietDem.push({
      ngay: dateKey,
      so_phong_giam_gia: night.so_phong_giam_gia,
      so_phong_gia_goc: night.so_phong_gia_goc,
      don_gia_giam: night.don_gia_giam,
      don_gia_goc: night.don_gia_goc,
      tong_tien_dem: night.tong_dem,
      gia_trung_binh_dem: Math.round(night.tong_dem / rooms),
      quota_con_lai: night.quota_con_lai,
    });
  });

  const nights = ctx.dates.length;

  return {
    gia_tu_dem: Math.round(totalAll / rooms / nights),
    gia_goc_dem: Math.round(totalBaseAll / rooms / nights),
    co_giam_gia: totalAll < totalBaseAll,
    la_gia_trung_binh: laGiaTrungBinh,
    tong_luong_tru: Math.round(totalAll / rooms),
    tong_goc: Math.round(totalBaseAll / rooms),
    tong_luong_tru_tat_ca: totalAll,
    so_dem: nights,
    so_phong: rooms,
    phong_gia_khuyen_mai_con: hasPromoQuota && minQuotaRemaining !== Infinity
      ? minQuotaRemaining
      : null,
    chi_tiet_dem: chiTietDem,
  };
};

const isAutoCompletedBooking = (booking) =>
  Boolean(booking?.ghi_chu?.includes(AUTO_COMPLETE_MARKER));

const isStayPeriodEnded = (ngayTraPhong) => {
  const checkoutKey = formatDateKey(ngayTraPhong);
  const todayKey = formatDateKey(new Date());
  if (!checkoutKey || !todayKey) return false;
  return checkoutKey < todayKey;
};

const appendAutoCompleteMarker = (ghiChu) => {
  if (ghiChu?.includes(AUTO_COMPLETE_MARKER)) return ghiChu;
  return ghiChu ? `${ghiChu}\n${AUTO_COMPLETE_MARKER}` : AUTO_COMPLETE_MARKER;
};
// Tự động hoàn thành booking hết hạn
const autoCompleteExpiredCheckIns = async (where = {}) => {
  const candidates = await prisma.dat_phong.findMany({
    where: {
      ...where,
      trang_thai: { in: [...PENDING_CHECKIN_STATUS, 'da_checkin'] },
    },
  });

  const pendingExpired = candidates.filter(
    (booking) => PENDING_CHECKIN_STATUS.includes(booking.trang_thai)
      && isStayPeriodEnded(booking.ngay_tra_phong),
  );

  const checkedInExpired = candidates.filter(
    (booking) => booking.trang_thai === 'da_checkin'
      && isStayPeriodEnded(booking.ngay_tra_phong),
  );

  if (!pendingExpired.length && !checkedInExpired.length) return 0;

  await Promise.all([
    ...pendingExpired.map((booking) => prisma.dat_phong.update({
      where: { ma_dat_phong: booking.ma_dat_phong },
      data: {
        trang_thai: 'hoan_thanh',
        ghi_chu: appendAutoCompleteMarker(booking.ghi_chu),
      },
    })),
    ...checkedInExpired.map((booking) => prisma.dat_phong.update({
      where: { ma_dat_phong: booking.ma_dat_phong },
      data: { trang_thai: 'hoan_thanh' },
    })),
  ]);

  await Promise.all(
    [...pendingExpired, ...checkedInExpired].map((booking) =>
      ensureCommissionForBooking(booking.ma_dat_phong),
    ),
  );

  return pendingExpired.length + checkedInExpired.length;
};

module.exports = {
  ACTIVE_BOOKING,
  PENDING_CHECKIN_STATUS,
  AUTO_COMPLETE_MARKER,
  parseDate,
  formatDateKey,
  getDatesInRange,
  countOverlappingBookings,
  countActiveBookedRooms,
  countActiveBookedRoomsMap,
  calcRoomAvailability,
  calcStayPrice,
  isAutoCompletedBooking,
  isStayPeriodEnded,
  autoCompleteExpiredCheckIns,
};
