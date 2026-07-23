const prisma = require('../../../config/prisma');

const REVENUE_STATUSES = ['hoan_thanh'];
const CANCEL_STATUSES = ['da_huy'];
const COMPLETED_STATUSES = ['hoan_thanh'];
const ACTIVE_HOTEL = ['hoat_dong', 'da_duyet'];

const toNumber = (v) => Number(v) || 0;

const parseDateRange = (query = {}) => {
  const { tu_ngay, den_ngay } = query;
  let from = null;
  let to = null;
  if (tu_ngay) {
    from = new Date(tu_ngay);
    from.setHours(0, 0, 0, 0);
  }
  if (den_ngay) {
    to = new Date(den_ngay);
    to.setHours(23, 59, 59, 999);
  }
  return { from, to };
};

const inRange = (date, from, to) => {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

const monthKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return `T${Number(m)}/${y}`;
};

const quarterKey = (date) => {
  const d = new Date(date);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
};

const yearKey = (date) => String(new Date(date).getFullYear());

const dayKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayLabel = (key) => {
  const [, m, day] = key.split('-');
  return `${Number(day)}/${Number(m)}`;
};

const buildDaySeries = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getFullYear(), end.getMonth(), end.getDate() - 13);
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const keys = [];
  while (cursor <= endDay) {
    keys.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

const emptyDayMap = (keys) => {
  const map = {};
  keys.forEach((k) => {
    map[k] = { key: k, label: dayLabel(k), value: 0, count: 0 };
  });
  return map;
};

const emptyQuarterMap = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getFullYear(), 0, 1);
  const map = {};
  const cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    const key = quarterKey(cursor);
    map[key] = { key, label: key, value: 0, count: 0 };
    cursor.setMonth(cursor.getMonth() + 3);
  }
  return map;
};

const emptyYearMap = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getFullYear() - 2, 0, 1);
  const map = {};
  for (let y = start.getFullYear(); y <= end.getFullYear(); y += 1) {
    const key = String(y);
    map[key] = { key, label: key, value: 0, count: 0 };
  }
  return map;
};

const seriesBucketKey = (date, nhom) => {
  if (nhom === 'ngay' || nhom === 'tuan') return dayKey(date);
  if (nhom === 'quy') return quarterKey(date);
  if (nhom === 'nam') return yearKey(date);
  return monthKey(date);
};

const buildEmptySeries = (from, to, nhom) => {
  if (nhom === 'ngay' || nhom === 'tuan') return emptyDayMap(buildDaySeries(from, to));
  if (nhom === 'quy') return emptyQuarterMap(from, to);
  if (nhom === 'nam') return emptyYearMap(from, to);
  return emptyMonthMap(buildMonthSeries(from, to));
};

const buildMonthSeries = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from
    ? new Date(from)
    : new Date(end.getFullYear(), end.getMonth() - 11, 1);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const keys = [];
  while (cursor <= end) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

const emptyMonthMap = (keys) => {
  const map = {};
  keys.forEach((k) => {
    map[k] = { key: k, label: monthLabel(k), value: 0, count: 0 };
  });
  return map;
};

const topN = (map, n, valueKey = 'value') =>
  Object.values(map)
    .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
    .slice(0, n);

const loadBookings = async () =>
  prisma.dat_phong.findMany({
    select: {
      ma_dat_phong: true,
      ma_khach_hang: true,
      ma_don_hang: true,
      ngay_dat: true,
      ngay_nhan_phong: true,
      ngay_tra_phong: true,
      thanh_toan_cuoi: true,
      trang_thai: true,
      loai_phong: {
        select: {
          ma_khach_san: true,
          khach_san: {
            select: {
              ma_khach_san: true,
              ten: true,
              ma_doi_tac: true,
              trang_thai: true,
              doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true, trang_thai: true, ngay_cap_tai_khoan: true } },
              dia_diem: { select: { ten_dia_diem: true, tinh_thanh: true } },
            },
          },
        },
      },
      thanh_toan: { select: { trang_thai: true, so_tien: true, thoi_gian: true } },
      hoa_hong: { select: { so_tien_hoa_hong: true } },
      hoan_tien: { select: { so_tien_hoan: true, trang_thai: true, ngay_yeu_cau: true, ngay_xu_ly: true } },
    },
  });

const isRevenueBooking = (b) => {
  if (REVENUE_STATUSES.includes(b.trang_thai)) return true;
  return b.thanh_toan?.trang_thai === 'thanh_cong' && !CANCEL_STATUSES.includes(b.trang_thai);
};

const bookingAmount = (b) => {
  if (b.thanh_toan?.trang_thai === 'thanh_cong') return toNumber(b.thanh_toan.so_tien);
  return toNumber(b.thanh_toan_cuoi);
};

const bookingDate = (b) => b.ngay_dat || b.thanh_toan?.thoi_gian || b.ngay_tra_phong;

const bookingNights = (b) => {
  const checkIn = b.ngay_nhan_phong;
  const checkOut = b.ngay_tra_phong;
  if (!checkIn || !checkOut) return 1;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (Number.isNaN(ms) || ms <= 0) return 1;
  return Math.max(1, Math.round(ms / 86400000));
};

const countDaysInclusive = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getFullYear(), end.getMonth(), 1);
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
};

const analyticsService = {
  getOverview: async (query = {}) => {
    const { from, to } = parseDateRange(query);
    const nhom = ['ngay', 'tuan', 'thang', 'quy', 'nam'].includes(query.nhom)
      ? query.nhom
      : 'thang';

    const [bookings, hotels, customers, partners] = await Promise.all([
      loadBookings(),
      prisma.khach_san.count(),
      prisma.khach_hang.count(),
      prisma.doi_tac.count(),
    ]);

    const scoped = bookings.filter((b) => inRange(bookingDate(b), from, to));
    const revenueBookings = scoped.filter(isRevenueBooking);
    const cancelled = scoped.filter((b) => CANCEL_STATUSES.includes(b.trang_thai));

    const tongDoanhThu = revenueBookings.reduce((s, b) => s + bookingAmount(b), 0);
    const tongDatPhong = scoped.length;
    const tyLeHuy = tongDatPhong > 0 ? (cancelled.length / tongDatPhong) * 100 : 0;

    const revenueSeries = buildEmptySeries(from, to, nhom);
    const bookingSeries = buildEmptySeries(from, to, nhom);
    scoped.forEach((b) => {
      const date = bookingDate(b);
      if (!date) return;
      const key = seriesBucketKey(date, nhom);
      if (bookingSeries[key]) {
        bookingSeries[key].count += 1;
        bookingSeries[key].value += 1;
      }
      if (isRevenueBooking(b) && revenueSeries[key]) {
        revenueSeries[key].value += bookingAmount(b);
        revenueSeries[key].count += 1;
      }
    });

    const hotelRevenue = {};
    revenueBookings.forEach((b) => {
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return;
      const id = hotel.ma_khach_san;
      if (!hotelRevenue[id]) {
        hotelRevenue[id] = { ma_khach_san: id, ten: hotel.ten, value: 0 };
      }
      hotelRevenue[id].value += bookingAmount(b);
    });

    const statusMap = {};
    scoped.forEach((b) => {
      const st = b.trang_thai || 'khac';
      if (!statusMap[st]) statusMap[st] = { name: st, value: 0 };
      statusMap[st].value += 1;
    });

    return {
      kpis: {
        tong_doanh_thu: tongDoanhThu,
        tong_dat_phong: tongDatPhong,
        tong_khach_san: hotels,
        tong_khach_hang: customers,
        tong_doi_tac: partners,
        ty_le_huy: Number(tyLeHuy.toFixed(1)),
      },
      nhom,
      charts: {
        doanh_thu_theo_thoi_gian: Object.values(revenueSeries),
        don_dat_theo_thoi_gian: Object.values(bookingSeries),
        top_khach_san_doanh_thu: topN(hotelRevenue, 5),
        phan_bo_trang_thai_don_dat: Object.values(statusMap),
      },
    };
  },

  getFinance: async (query = {}) => {
    const { from, to } = parseDateRange(query);
    const partnerId = query.ma_doi_tac ? parseInt(query.ma_doi_tac, 10) : null;
    const hotelId = query.ma_khach_san ? parseInt(query.ma_khach_san, 10) : null;
    const cityFilter = (query.thanh_pho || '').trim();

    const [bookings, hotels, partners] = await Promise.all([
      loadBookings(),
      prisma.khach_san.findMany({
        select: {
          ma_khach_san: true,
          ten: true,
          ma_doi_tac: true,
          dia_diem: { select: { tinh_thanh: true, ten_dia_diem: true } },
        },
        orderBy: { ten: 'asc' },
      }),
      prisma.doi_tac.findMany({
        select: { ma_doi_tac: true, ten_cong_ty: true },
        orderBy: { ten_cong_ty: 'asc' },
      }),
    ]);

    const hotelCity = (hotel) =>
      hotel?.dia_diem?.tinh_thanh || hotel?.dia_diem?.ten_dia_diem || 'Khác';

    const matchFilters = (hotel) => {
      if (!hotel) return false;
      if (partnerId && !Number.isNaN(partnerId) && hotel.ma_doi_tac !== partnerId) return false;
      if (hotelId && !Number.isNaN(hotelId) && hotel.ma_khach_san !== hotelId) return false;
      if (cityFilter && hotelCity(hotel) !== cityFilter) return false;
      return true;
    };

    const scoped = bookings.filter((b) => {
      if (!inRange(bookingDate(b), from, to)) return false;
      return matchFilters(b.loai_phong?.khach_san);
    });

    const revenueByHotel = {};
    let tongDoanhThu = 0;
    let tongHoaHong = 0;
    let soBookingThanhCong = 0;

    scoped.filter(isRevenueBooking).forEach((b) => {
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return;
      const amount = bookingAmount(b);
      const commission = toNumber(b.hoa_hong?.so_tien_hoa_hong);
      const id = hotel.ma_khach_san;
      if (!revenueByHotel[id]) {
        revenueByHotel[id] = {
          ma_khach_san: id,
          ten_khach_san: hotel.ten,
          ma_doi_tac: hotel.doi_tac?.ma_doi_tac || hotel.ma_doi_tac || null,
          ten_doi_tac: hotel.doi_tac?.ten_cong_ty || '—',
          thanh_pho: hotelCity(hotel),
          so_don: 0,
          doanh_thu: 0,
          hoa_hong: 0,
        };
      }
      revenueByHotel[id].so_don += 1;
      revenueByHotel[id].doanh_thu += amount;
      revenueByHotel[id].hoa_hong += commission;
      tongDoanhThu += amount;
      tongHoaHong += commission;
      soBookingThanhCong += 1;
    });

    const bookingCountByHotel = {};
    scoped.forEach((b) => {
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return;
      const id = hotel.ma_khach_san;
      bookingCountByHotel[id] = (bookingCountByHotel[id] || 0) + 1;
    });

    const refundByHotel = {};
    let tongTienHoan = 0;
    let soDonHoan = 0;

    scoped.forEach((b) => {
      const r = b.hoan_tien;
      if (!r || r.trang_thai !== 'da_hoan') return;
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return;
      const id = hotel.ma_khach_san;
      const amount = toNumber(r.so_tien_hoan);
      if (!refundByHotel[id]) {
        refundByHotel[id] = {
          ma_khach_san: id,
          ten_khach_san: hotel.ten,
          ma_doi_tac: hotel.doi_tac?.ma_doi_tac || hotel.ma_doi_tac || null,
          ten_doi_tac: hotel.doi_tac?.ten_cong_ty || '—',
          so_don_hoan: 0,
          tien_hoan: 0,
        };
      }
      refundByHotel[id].so_don_hoan += 1;
      refundByHotel[id].tien_hoan += amount;
      tongTienHoan += amount;
      soDonHoan += 1;
    });

    const doanhThuRows = Object.values(revenueByHotel).sort((a, b) => b.doanh_thu - a.doanh_thu);

    const hoanTienRows = Object.values(refundByHotel)
      .map((row) => {
        const tongDon = bookingCountByHotel[row.ma_khach_san] || 0;
        const tyLe = tongDon > 0 ? (row.so_don_hoan / tongDon) * 100 : 0;
        return {
          ...row,
          tong_don: tongDon,
          ty_le_hoan: Number(tyLe.toFixed(1)),
        };
      })
      .sort((a, b) => b.tien_hoan - a.tien_hoan);

    const tongDonScoped = scoped.length;
    const tyLeHoanTb =
      tongDonScoped > 0 ? Number(((soDonHoan / tongDonScoped) * 100).toFixed(1)) : 0;

    const cities = [
      ...new Set(hotels.map((h) => hotelCity(h)).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, 'vi'));

    return {
      filters: {
        doi_tac: partners.map((p) => ({
          ma_doi_tac: p.ma_doi_tac,
          ten: p.ten_cong_ty,
        })),
        khach_san: hotels.map((h) => ({
          ma_khach_san: h.ma_khach_san,
          ten: h.ten,
          ma_doi_tac: h.ma_doi_tac,
          thanh_pho: hotelCity(h),
        })),
        thanh_pho: cities,
      },
      doanh_thu: {
        kpis: {
          tong_doanh_thu: tongDoanhThu,
          tong_hoa_hong: tongHoaHong,
          so_booking_thanh_cong: soBookingThanhCong,
        },
        rows: doanhThuRows,
      },
      hoan_tien: {
        kpis: {
          tong_tien_hoan: tongTienHoan,
          ty_le_hoan_tb: tyLeHoanTb,
          so_don_hoan: soDonHoan,
        },
        rows: hoanTienRows,
      },
    };
  },

  getBusiness: async (query = {}) => {
    const { from, to } = parseDateRange(query);
    const partnerId = query.ma_doi_tac ? parseInt(query.ma_doi_tac, 10) : null;
    const hotelId = query.ma_khach_san ? parseInt(query.ma_khach_san, 10) : null;
    const cityFilter = (query.thanh_pho || '').trim();
    const starFilter = query.so_sao ? parseInt(query.so_sao, 10) : null;

    const SUCCESS_STATUSES = ['hoan_thanh'];
    const FAIL_STATUSES = ['da_huy', 'tu_choi'];

    const [bookings, hotels, partners, reviews] = await Promise.all([
      loadBookings(),
      prisma.khach_san.findMany({
        select: {
          ma_khach_san: true,
          ten: true,
          ma_doi_tac: true,
          dia_diem: { select: { tinh_thanh: true, ten_dia_diem: true } },
          loai_phong: { select: { so_luong_mo_ban: true, so_luong_phong: true } },
        },
        orderBy: { ten: 'asc' },
      }),
      prisma.doi_tac.findMany({
        select: { ma_doi_tac: true, ten_cong_ty: true },
        orderBy: { ten_cong_ty: 'asc' },
      }),
      prisma.danh_gia.findMany({
        where: {
          trang_thai: 'hien_thi',
          ...(from || to
            ? {
                ngay_danh_gia: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
        select: {
          so_sao: true,
          ngay_danh_gia: true,
          dat_phong: {
            select: {
              loai_phong: {
                select: {
                  khach_san: {
                    select: {
                      ma_khach_san: true,
                      ten: true,
                      ma_doi_tac: true,
                      doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true } },
                      dia_diem: { select: { tinh_thanh: true, ten_dia_diem: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const hotelCity = (hotel) =>
      hotel?.dia_diem?.tinh_thanh || hotel?.dia_diem?.ten_dia_diem || 'Khác';

    const matchFilters = (hotel) => {
      if (!hotel) return false;
      if (partnerId && !Number.isNaN(partnerId) && hotel.ma_doi_tac !== partnerId) return false;
      if (hotelId && !Number.isNaN(hotelId) && hotel.ma_khach_san !== hotelId) return false;
      if (cityFilter && hotelCity(hotel) !== cityFilter) return false;
      return true;
    };

    const scopedBookings = bookings.filter((b) => {
      if (!inRange(bookingDate(b), from, to)) return false;
      return matchFilters(b.loai_phong?.khach_san);
    });

    const bookingByHotel = {};
    let tongBooking = 0;
    let tongHuy = 0;
    let occupiedNights = 0;

    scopedBookings.forEach((b) => {
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return;
      const id = hotel.ma_khach_san;
      if (!bookingByHotel[id]) {
        bookingByHotel[id] = {
          ma_khach_san: id,
          ten_khach_san: hotel.ten,
          ma_doi_tac: hotel.doi_tac?.ma_doi_tac || hotel.ma_doi_tac || null,
          ten_doi_tac: hotel.doi_tac?.ten_cong_ty || '—',
          thanh_pho: hotelCity(hotel),
          tong_booking: 0,
          thanh_cong: 0,
          khong_thanh_cong: 0,
          da_huy: 0,
        };
      }
      bookingByHotel[id].tong_booking += 1;
      tongBooking += 1;
      if (SUCCESS_STATUSES.includes(b.trang_thai)) bookingByHotel[id].thanh_cong += 1;
      if (FAIL_STATUSES.includes(b.trang_thai)) bookingByHotel[id].khong_thanh_cong += 1;
      if (CANCEL_STATUSES.includes(b.trang_thai)) {
        bookingByHotel[id].da_huy += 1;
        tongHuy += 1;
      } else {
        occupiedNights += bookingNights(b);
      }
    });

    const periodDays = countDaysInclusive(from, to);
    const hotelIdsWithBookings = new Set(
      Object.keys(bookingByHotel).map((id) => parseInt(id, 10))
    );
    const availableRooms = hotels.reduce((sum, h) => {
      if (!hotelIdsWithBookings.has(h.ma_khach_san)) return sum;
      const rooms = (h.loai_phong || []).reduce(
        (s, lp) => s + (toNumber(lp.so_luong_mo_ban) || toNumber(lp.so_luong_phong) || 0),
        0
      );
      return sum + rooms;
    }, 0);
    const availableNights = availableRooms * periodDays;
    const activeBookings = Math.max(0, tongBooking - tongHuy);
    const tyLeLapDay =
      availableNights > 0
        ? Number(((occupiedNights / availableNights) * 100).toFixed(1))
        : tongBooking > 0
          ? Number(((activeBookings / tongBooking) * 100).toFixed(1))
          : 0;
    const tyLeHuyTb =
      tongBooking > 0 ? Number(((tongHuy / tongBooking) * 100).toFixed(1)) : 0;

    const datPhongRows = Object.values(bookingByHotel)
      .map((row) => ({
        ...row,
        ty_le_huy:
          row.tong_booking > 0
            ? Number(((row.da_huy / row.tong_booking) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.tong_booking - a.tong_booking);

    const scopedReviews = reviews.filter((r) =>
      matchFilters(r.dat_phong?.loai_phong?.khach_san)
    );

    let tongSaoAll = 0;
    scopedReviews.forEach((r) => {
      tongSaoAll += toNumber(r.so_sao);
    });
    const diemHaiLongTb =
      scopedReviews.length > 0
        ? Number(((tongSaoAll / scopedReviews.length) * 2).toFixed(1))
        : 0;

    const reviewByHotel = {};
    scopedReviews.forEach((r) => {
      if (starFilter && !Number.isNaN(starFilter) && toNumber(r.so_sao) !== starFilter) {
        return;
      }
      const hotel = r.dat_phong?.loai_phong?.khach_san;
      if (!hotel) return;
      const id = hotel.ma_khach_san;
      if (!reviewByHotel[id]) {
        reviewByHotel[id] = {
          ma_khach_san: id,
          ten_khach_san: hotel.ten,
          ma_doi_tac: hotel.doi_tac?.ma_doi_tac || hotel.ma_doi_tac || null,
          ten_doi_tac: hotel.doi_tac?.ten_cong_ty || '—',
          thanh_pho: hotelCity(hotel),
          tong_sao: 0,
          luot_danh_gia: 0,
          sao_5: 0,
          sao_4: 0,
          sao_3: 0,
          sao_2: 0,
          sao_1: 0,
        };
      }
      const stars = toNumber(r.so_sao);
      reviewByHotel[id].tong_sao += stars;
      reviewByHotel[id].luot_danh_gia += 1;
      if (stars === 5) reviewByHotel[id].sao_5 += 1;
      else if (stars === 4) reviewByHotel[id].sao_4 += 1;
      else if (stars === 3) reviewByHotel[id].sao_3 += 1;
      else if (stars === 2) reviewByHotel[id].sao_2 += 1;
      else if (stars === 1) reviewByHotel[id].sao_1 += 1;
    });

    const danhGiaRows = Object.values(reviewByHotel)
      .map((row) => {
        const avg5 =
          row.luot_danh_gia > 0 ? row.tong_sao / row.luot_danh_gia : 0;
        return {
          ma_khach_san: row.ma_khach_san,
          ten_khach_san: row.ten_khach_san,
          ma_doi_tac: row.ma_doi_tac,
          ten_doi_tac: row.ten_doi_tac,
          thanh_pho: row.thanh_pho,
          diem_trung_binh: Number((avg5 * 2).toFixed(1)),
          luot_danh_gia: row.luot_danh_gia,
          sao_5: row.sao_5,
          sao_4: row.sao_4,
          sao_3: row.sao_3,
          sao_2: row.sao_2,
          sao_1: row.sao_1,
        };
      })
      .sort((a, b) => b.diem_trung_binh - a.diem_trung_binh || b.luot_danh_gia - a.luot_danh_gia);

    const cities = [
      ...new Set(hotels.map((h) => hotelCity(h)).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, 'vi'));

    return {
      filters: {
        doi_tac: partners.map((p) => ({
          ma_doi_tac: p.ma_doi_tac,
          ten: p.ten_cong_ty,
        })),
        khach_san: hotels.map((h) => ({
          ma_khach_san: h.ma_khach_san,
          ten: h.ten,
          ma_doi_tac: h.ma_doi_tac,
          thanh_pho: hotelCity(h),
        })),
        thanh_pho: cities,
      },
      dat_phong: {
        kpis: {
          tong_booking: tongBooking,
          ty_le_lap_day: tyLeLapDay,
          ty_le_huy_tb: tyLeHuyTb,
        },
        rows: datPhongRows,
      },
      danh_gia: {
        kpis: {
          diem_hai_long_tb: diemHaiLongTb,
          tong_luot_danh_gia: scopedReviews.length,
        },
        rows: danhGiaRows,
      },
    };
  },

  getSystem: async (query = {}) => {
    const { from, to } = parseDateRange(query);
    const partnerId = query.ma_doi_tac ? parseInt(query.ma_doi_tac, 10) : null;
    const hotelId = query.ma_khach_san ? parseInt(query.ma_khach_san, 10) : null;
    const cityFilter = (query.thanh_pho || '').trim();

    const [hotels, partners, customers, bookings] = await Promise.all([
      prisma.khach_san.findMany({
        select: {
          ma_khach_san: true,
          ten: true,
          ma_doi_tac: true,
          trang_thai: true,
          doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true, trang_thai: true } },
          dia_diem: { select: { tinh_thanh: true, ten_dia_diem: true } },
        },
        orderBy: { ten: 'asc' },
      }),
      prisma.doi_tac.findMany({
        select: {
          ma_doi_tac: true,
          ten_cong_ty: true,
          trang_thai: true,
          _count: { select: { khach_san: true } },
        },
        orderBy: { ten_cong_ty: 'asc' },
      }),
      prisma.khach_hang.findMany({
        select: {
          ma_khach_hang: true,
          ho_ten: true,
          nguoi_dung: { select: { ngay_tao: true } },
        },
        orderBy: { ho_ten: 'asc' },
      }),
      loadBookings(),
    ]);

    const hotelCity = (hotel) =>
      hotel?.dia_diem?.tinh_thanh || hotel?.dia_diem?.ten_dia_diem || 'Khác';

    const matchHotelFilters = (hotel) => {
      if (!hotel) return false;
      if (partnerId && !Number.isNaN(partnerId) && hotel.ma_doi_tac !== partnerId) return false;
      if (hotelId && !Number.isNaN(hotelId) && hotel.ma_khach_san !== hotelId) return false;
      if (cityFilter && hotelCity(hotel) !== cityFilter) return false;
      return true;
    };

    const filteredHotels = hotels.filter(matchHotelFilters);
    const filteredHotelIds = new Set(filteredHotels.map((h) => h.ma_khach_san));
    const filteredPartnerIds = new Set(filteredHotels.map((h) => h.ma_doi_tac));

    const scopedBookings = bookings.filter((b) => {
      if (!inRange(bookingDate(b), from, to)) return false;
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return false;
      return filteredHotelIds.has(hotel.ma_khach_san);
    });

    const bookingCountByHotel = {};
    const revenueByHotel = {};
    const bookingCountByPartner = {};
    const revenueByPartner = {};
    const customerStats = {};

    scopedBookings.forEach((b) => {
      const hotel = b.loai_phong?.khach_san;
      if (!hotel) return;
      const hotelKey = hotel.ma_khach_san;
      bookingCountByHotel[hotelKey] = (bookingCountByHotel[hotelKey] || 0) + 1;
      if (isRevenueBooking(b)) {
        revenueByHotel[hotelKey] = (revenueByHotel[hotelKey] || 0) + bookingAmount(b);
      }

      const pId = hotel.doi_tac?.ma_doi_tac || hotel.ma_doi_tac;
      if (pId != null) {
        bookingCountByPartner[pId] = (bookingCountByPartner[pId] || 0) + 1;
        if (isRevenueBooking(b)) {
          revenueByPartner[pId] = (revenueByPartner[pId] || 0) + bookingAmount(b);
        }
      }

      const cId = b.ma_khach_hang;
      if (cId == null) return;
      if (!customerStats[cId]) {
        customerStats[cId] = { tong_don: 0, tong_chi_tieu: 0, lan_cuoi_dat: null };
      }
      customerStats[cId].tong_don += 1;
      if (isRevenueBooking(b)) {
        customerStats[cId].tong_chi_tieu += bookingAmount(b);
      }
      const bookedAt = bookingDate(b);
      if (bookedAt) {
        const prev = customerStats[cId].lan_cuoi_dat;
        if (!prev || new Date(bookedAt) > new Date(prev)) {
          customerStats[cId].lan_cuoi_dat = bookedAt;
        }
      }
    });

    const khachSanRows = filteredHotels
      .map((h) => ({
        ma_khach_san: h.ma_khach_san,
        ten_khach_san: h.ten,
        ma_doi_tac: h.ma_doi_tac,
        ten_doi_tac: h.doi_tac?.ten_cong_ty || '—',
        thanh_pho: hotelCity(h),
        trang_thai: h.trang_thai,
        tong_doanh_thu: revenueByHotel[h.ma_khach_san] || 0,
        so_don: bookingCountByHotel[h.ma_khach_san] || 0,
      }))
      .sort((a, b) => b.so_don - a.so_don || a.ten_khach_san.localeCompare(b.ten_khach_san, 'vi'));

    const partnerList =
      partnerId && !Number.isNaN(partnerId)
        ? partners.filter((p) => p.ma_doi_tac === partnerId)
        : cityFilter || hotelId
          ? partners.filter((p) => filteredPartnerIds.has(p.ma_doi_tac))
          : partners;

    const doiTacRows = partnerList
      .map((p) => ({
        ma_doi_tac: p.ma_doi_tac,
        ten_doi_tac: p.ten_cong_ty,
        so_khach_san: p._count?.khach_san || 0,
        so_don: bookingCountByPartner[p.ma_doi_tac] || 0,
        doanh_thu: revenueByPartner[p.ma_doi_tac] || 0,
        trang_thai: p.trang_thai,
      }))
      .sort((a, b) => b.doanh_thu - a.doanh_thu || a.ten_doi_tac.localeCompare(b.ten_doi_tac, 'vi'));

    const customerMap = Object.fromEntries(customers.map((c) => [c.ma_khach_hang, c]));
    const khachHangRows = Object.entries(customerStats)
      .map(([id, stats]) => {
        const c = customerMap[Number(id)];
        return {
          ma_khach_hang: Number(id),
          ten_khach_hang: c?.ho_ten || `KH #${id}`,
          ngay_dang_ky: c?.nguoi_dung?.ngay_tao || null,
          lan_cuoi_dat: stats.lan_cuoi_dat || null,
          tong_don: stats.tong_don,
          tong_chi_tieu: stats.tong_chi_tieu,
        };
      })
      .sort((a, b) => b.tong_chi_tieu - a.tong_chi_tieu || b.tong_don - a.tong_don);

    const cities = [
      ...new Set(hotels.map((h) => hotelCity(h)).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, 'vi'));

    return {
      filters: {
        doi_tac: partners.map((p) => ({
          ma_doi_tac: p.ma_doi_tac,
          ten: p.ten_cong_ty,
        })),
        khach_san: hotels.map((h) => ({
          ma_khach_san: h.ma_khach_san,
          ten: h.ten,
          ma_doi_tac: h.ma_doi_tac,
          thanh_pho: hotelCity(h),
        })),
        thanh_pho: cities,
      },
      khach_san: { rows: khachSanRows },
      doi_tac: { rows: doiTacRows },
      khach_hang: { rows: khachHangRows },
    };
  },

  /**
   * Dashboard trang chủ admin:
   * KPI + biểu đồ theo bộ lọc thời gian (giống overview báo cáo) + việc cần xử lý
   */
  getHomeDashboard: async (query = {}) => {
    let { from, to } = parseDateRange(query);
    if (!from && !to) {
      const now = new Date();
      to = new Date(now);
      to.setHours(23, 59, 59, 999);
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
    }
    const nhom = ['ngay', 'tuan', 'thang', 'quy', 'nam'].includes(query.nhom)
      ? query.nhom
      : 'ngay';

    const [
      tongNguoiDung,
      tongKhachSan,
      tongDoiTac,
      avgReview,
      yeuCauHopTac,
      choDuyetHotel,
      choHoanTien,
      baoCaoViPham,
      partnersChoTt,
      bookings,
    ] = await Promise.all([
      prisma.nguoi_dung.count(),
      prisma.khach_san.count(),
      prisma.doi_tac.count(),
      prisma.danh_gia.aggregate({
        where: { trang_thai: 'hien_thi' },
        _avg: { so_sao: true },
        _count: { _all: true },
      }),
      prisma.yeu_cau_hop_tac.count({ where: { trang_thai: 'cho_xu_ly' } }),
      prisma.khach_san.count({ where: { trang_thai: 'cho_duyet' } }),
      prisma.hoan_tien.count({
        where: { trang_thai: { in: ['cho_xu_ly', 'dang_xu_ly'] } },
      }),
      prisma.bao_cao.count({ where: { trang_thai: 'cho_xu_ly' } }),
      prisma.hoa_hong.findMany({
        where: { trang_thai: 'da_thu' },
        select: { ma_doi_tac: true },
        distinct: ['ma_doi_tac'],
      }),
      loadBookings(),
    ]);

    const scoped = bookings.filter((b) => inRange(bookingDate(b), from, to));
    const revenueBookings = scoped.filter(isRevenueBooking);
    const tongBooking = scoped.length;
    const tongDoanhThu = revenueBookings.reduce((s, b) => s + bookingAmount(b), 0);

    const revenueSeries = buildEmptySeries(from, to, nhom);
    const bookingSeries = buildEmptySeries(from, to, nhom);
    scoped.forEach((b) => {
      const date = bookingDate(b);
      if (!date) return;
      const key = seriesBucketKey(date, nhom);
      if (bookingSeries[key]) {
        bookingSeries[key].count += 1;
        bookingSeries[key].value += 1;
      }
      if (isRevenueBooking(b) && revenueSeries[key]) {
        revenueSeries[key].value += bookingAmount(b);
        revenueSeries[key].count += 1;
      }
    });

    const diemTb = avgReview._avg?.so_sao != null
      ? Number(Number(avgReview._avg.so_sao).toFixed(1))
      : 0;

    return {
      kpis: {
        tong_nguoi_dung: tongNguoiDung,
        tong_khach_san: tongKhachSan,
        tong_doi_tac: tongDoiTac,
        tong_booking: tongBooking,
        tong_doanh_thu: tongDoanhThu,
        diem_danh_gia_tb: diemTb,
      },
      nhom,
      charts: {
        doanh_thu_theo_thoi_gian: Object.values(revenueSeries),
        don_dat_theo_thoi_gian: Object.values(bookingSeries),
      },
      viec_can_xu_ly: {
        yeu_cau_hop_tac: yeuCauHopTac,
        cho_duyet: choDuyetHotel,
        thanh_toan: partnersChoTt.length,
        hoan_tien: choHoanTien,
        danh_gia_vi_pham: baoCaoViPham,
      },
    };
  },
};

module.exports = analyticsService;
