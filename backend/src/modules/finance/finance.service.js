const prisma = require('../../config/prisma');

const getDoiTacId = async (userId) => {
  const doiTac = await prisma.doi_tac.findUnique({
    where: { ma_nguoi_dung: Number(userId) },
    select: { ma_doi_tac: true },
  });
  return doiTac?.ma_doi_tac || null;
};

const parseFilters = (query = {}) => {
  const maKhachSan = query.ma_khach_san ? Number(query.ma_khach_san) : null;
  const startDate = query.startDate || query.tu_ngay || null;
  const endDate = query.endDate || query.den_ngay || null;

  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  return {
    maKhachSan: Number.isFinite(maKhachSan) ? maKhachSan : null,
    dateFilter: Object.keys(dateFilter).length ? dateFilter : null,
  };
};

const partnerHotelWhere = (doiTacId, maKhachSan) => ({
  ma_doi_tac: doiTacId,
  ...(maKhachSan ? { ma_khach_san: maKhachSan } : {}),
});

const bookingBaseWhere = (doiTacId, { maKhachSan, dateFilter }) => ({
  loai_phong: {
    khach_san: partnerHotelWhere(doiTacId, maKhachSan),
  },
  ...(dateFilter ? { ngay_dat: dateFilter } : {}),
});

const isCancelled = (booking) => ['da_huy', 'tu_choi'].includes(booking.trang_thai);

const isPaid = (booking) => {
  if (booking.thanh_toan?.trang_thai === 'thanh_cong') return true;
  if (booking.phuong_thuc_tt === 'tai_khach_san' && booking.trang_thai === 'hoan_thanh') {
    return true;
  }
  return false;
};

const isFullRefund = (booking) => {
  const refund = booking.hoan_tien;
  if (!refund || refund.trang_thai !== 'da_hoan') return false;
  const gross = Number(booking.thanh_toan_cuoi) || 0;
  const refundAmount = Number(refund.so_tien_hoan) || 0;
  return gross > 0 && refundAmount >= gross * 0.99;
};

/** Đơn tính doanh thu: đã thanh toán, không hủy, không hoàn toàn bộ; ưu tiên đã hoàn thành / đang lưu trú */
const isRevenueBooking = (booking) => (
  !isCancelled(booking)
  && isPaid(booking)
  && !isFullRefund(booking)
  && ['hoan_thanh', 'da_checkin'].includes(booking.trang_thai)
);

const calcAmounts = (booking) => {
  const gross = Number(booking.thanh_toan_cuoi) || 0;
  const commission = booking.hoa_hong ? Number(booking.hoa_hong.so_tien_hoa_hong) || 0 : 0;
  const refund = booking.hoan_tien && booking.hoan_tien.trang_thai === 'da_hoan'
    ? Number(booking.hoan_tien.so_tien_hoan) || 0
    : 0;
  const partnerNet = Math.max(0, gross - commission - refund);
  return { gross, commission, refund, partnerNet };
};

const bookingInclude = {
  thanh_toan: true,
  hoa_hong: true,
  hoan_tien: true,
  loai_phong: {
    select: {
      ma_loai_phong: true,
      ten_loai: true,
      khach_san: {
        select: {
          ma_khach_san: true,
          ten: true,
        },
      },
    },
  },
};

const getHotels = async (doiTacId) => {
  const hotels = await prisma.khach_san.findMany({
    where: { ma_doi_tac: doiTacId },
    select: { ma_khach_san: true, ten: true },
    orderBy: { ten: 'asc' },
  });
  return hotels;
};

const fetchPartnerBookings = async (doiTacId, filters) => {
  return prisma.dat_phong.findMany({
    where: bookingBaseWhere(doiTacId, filters),
    include: bookingInclude,
    orderBy: { ngay_dat: 'desc' },
  });
};

const monthKeyFromDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatMonthShort = (thangNam) => {
  const [y, m] = String(thangNam).split('-');
  if (!y || !m) return thangNam;
  return `T${Number(m)}/${y}`;
};

const listMonthKeys = (fromDate, toDate) => {
  const keys = [];
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (cursor <= end) {
    keys.push(monthKeyFromDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

const getOverview = async (doiTacId, query) => {
  const filters = parseFilters(query);

  
  let trendFilters = filters;
  if (!filters.dateFilter) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    trendFilters = {
      ...filters,
      dateFilter: { gte: start, lte: now },
    };
  }

  const [bookings, trendBookings, commissions] = await Promise.all([
    fetchPartnerBookings(doiTacId, filters),
    filters.dateFilter
      ? Promise.resolve(null)
      : fetchPartnerBookings(doiTacId, trendFilters),
    prisma.hoa_hong.findMany({
      where: {
        ma_doi_tac: doiTacId,
        ...(filters.dateFilter ? { ngay_tinh: filters.dateFilter } : {}),
        dat_phong: {
          loai_phong: {
            khach_san: partnerHotelWhere(doiTacId, filters.maKhachSan),
          },
        },
      },
      include: {
        dat_phong: {
          include: {
            hoan_tien: true,
            thanh_toan: true,
            loai_phong: {
              select: {
                ten_loai: true,
                khach_san: { select: { ma_khach_san: true, ten: true } },
              },
            },
          },
        },
      },
      orderBy: { ngay_tinh: 'desc' },
    }),
  ]);

  const revenueBookings = bookings.filter(isRevenueBooking);
  const trendSource = (trendBookings || bookings).filter(
    (booking) => isRevenueBooking(booking) && booking.trang_thai === 'hoan_thanh',
  );

  let tongDoanhThu = 0;
  let doanhThuHoanThanh = 0;
  let hoaHongHeThong = 0;
  let tienDoiTacNhan = 0;
  const hotelMap = new Map();

  revenueBookings.forEach((booking) => {
    const { gross, commission, partnerNet } = calcAmounts(booking);
    tongDoanhThu += gross;
    if (booking.trang_thai === 'hoan_thanh') {
      doanhThuHoanThanh += gross;
    }
    hoaHongHeThong += commission;
    tienDoiTacNhan += partnerNet;

    const hotel = booking.loai_phong?.khach_san;
    if (hotel?.ma_khach_san) {
      if (!hotelMap.has(hotel.ma_khach_san)) {
        hotelMap.set(hotel.ma_khach_san, {
          ma_khach_san: hotel.ma_khach_san,
          ten: hotel.ten || '—',
          doanh_thu: 0,
        });
      }
      hotelMap.get(hotel.ma_khach_san).doanh_thu += gross;
    }
  });

  let choThanhToan = 0;
  let daThanhToan = 0;

  commissions.forEach((row) => {
    const gross = Number(row.dat_phong?.thanh_toan_cuoi) || 0;
    const commission = Number(row.so_tien_hoa_hong) || 0;
    const refund = row.dat_phong?.hoan_tien?.trang_thai === 'da_hoan'
      ? Number(row.dat_phong.hoan_tien.so_tien_hoan) || 0
      : 0;
    const partnerAmount = Math.max(0, gross - commission - refund);

    if (row.trang_thai === 'da_thanh_toan') {
      daThanhToan += partnerAmount;
    } else if (['chua_thu', 'da_thu', 'tam_giu'].includes(row.trang_thai)) {
      choThanhToan += partnerAmount;
    }
  });

  const now = new Date();
  const trendStart = filters.dateFilter?.gte
    ? new Date(filters.dateFilter.gte)
    : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const trendEnd = filters.dateFilter?.lte
    ? new Date(filters.dateFilter.lte)
    : now;
  const monthKeys = listMonthKeys(trendStart, trendEnd);
  const monthTotals = new Map(monthKeys.map((key) => [key, 0]));

  trendSource.forEach((booking) => {
    const key = monthKeyFromDate(booking.ngay_tra_phong || booking.ngay_dat);
    if (key && monthTotals.has(key)) {
      monthTotals.set(key, monthTotals.get(key) + calcAmounts(booking).gross);
    }
  });

  const revenueTrend = monthKeys.map((thang) => ({
    thang,
    label: formatMonthShort(thang),
    doanh_thu: monthTotals.get(thang) || 0,
  }));

  const revenueByHotel = Array.from(hotelMap.values())
    .sort((a, b) => b.doanh_thu - a.doanh_thu)
    .slice(0, 8);

  const recentPayments = bookings
    .filter((booking) => isPaid(booking) && !isCancelled(booking))
    .map((booking) => {
      const hotel = booking.loai_phong?.khach_san;
      const { gross } = calcAmounts(booking);
      const paidAt = booking.thanh_toan?.thoi_gian
        || booking.thanh_toan?.ngay_cap_nhat
        || booking.ngay_dat;
      return {
        ma_dat_phong: booking.ma_dat_phong,
        ma_don_hang: booking.ma_don_hang,
        khach_san: hotel?.ten || '—',
        loai_phong: booking.loai_phong?.ten_loai || '—',
        tong_tien: gross,
        ngay_thanh_toan: paidAt,
        trang_thai: booking.trang_thai,
        thanh_toan: booking.thanh_toan,
        phuong_thuc_tt: booking.phuong_thuc_tt,
      };
    })
    .sort((a, b) => new Date(b.ngay_thanh_toan) - new Date(a.ngay_thanh_toan))
    .slice(0, 8);

  return {
    cards: {
      tong_doanh_thu: tongDoanhThu,
      hoa_hong: hoaHongHeThong,
      tien_doi_tac_nhan: tienDoiTacNhan,
      cho_thanh_toan: choThanhToan,
      da_thanh_toan: daThanhToan,
    },
    overview: {
      tong_doanh_thu: tongDoanhThu,
      doanh_thu_hoan_thanh: doanhThuHoanThanh,
      hoa_hong_he_thong: hoaHongHeThong,
      tien_doi_tac_nhan: tienDoiTacNhan,
      cho_thanh_toan: choThanhToan,
      da_thanh_toan: daThanhToan,
    },
    charts: {
      revenue_trend: revenueTrend,
      commission_split: [
        { name: 'Hoa hồng hệ thống', value: hoaHongHeThong },
        { name: 'Đối tác thực nhận', value: tienDoiTacNhan },
      ],
      revenue_by_hotel: revenueByHotel,
    },
    recent_payments: recentPayments,
  };
};

const getRevenueBookings = async (doiTacId, query) => {
  const filters = parseFilters(query);
  const bookings = await fetchPartnerBookings(doiTacId, filters);
  return bookings
    .filter(isRevenueBooking)
    .map((booking) => {
      const hotel = booking.loai_phong?.khach_san;
      const { gross } = calcAmounts(booking);
      return {
        ma_dat_phong: booking.ma_dat_phong,
        ma_don_hang: booking.ma_don_hang,
        khach_san: hotel?.ten || '—',
        ma_khach_san: hotel?.ma_khach_san || null,
        loai_phong: booking.loai_phong?.ten_loai || '—',
        ngay_nhan_phong: booking.ngay_nhan_phong,
        ngay_tra_phong: booking.ngay_tra_phong,
        ngay_hoan_thanh: booking.ngay_tra_phong,
        tong_tien: gross,
        trang_thai: booking.trang_thai,
        thanh_toan: booking.thanh_toan,
        phuong_thuc_tt: booking.phuong_thuc_tt,
      };
    });
};

const getCommissions = async (doiTacId, query) => {
  const filters = parseFilters(query);
  const rows = await prisma.hoa_hong.findMany({
    where: {
      ma_doi_tac: doiTacId,
      ...(filters.dateFilter ? { ngay_tinh: filters.dateFilter } : {}),
      dat_phong: {
        loai_phong: {
          khach_san: partnerHotelWhere(doiTacId, filters.maKhachSan),
        },
      },
    },
    include: {
      dat_phong: {
        include: {
          hoan_tien: true,
          loai_phong: {
            select: {
              ten_loai: true,
              khach_san: { select: { ma_khach_san: true, ten: true } },
            },
          },
        },
      },
    },
    orderBy: { ngay_tinh: 'desc' },
  });

  return rows.map((row) => {
    const booking = row.dat_phong;
    const gross = Number(booking?.thanh_toan_cuoi) || 0;
    const commission = Number(row.so_tien_hoa_hong) || 0;
    const refund = booking?.hoan_tien?.trang_thai === 'da_hoan'
      ? Number(booking.hoan_tien.so_tien_hoan) || 0
      : 0;
    return {
      ma_hoa_hong: row.ma_hoa_hong,
      ma_dat_phong: booking?.ma_dat_phong || null,
      ma_don_hang: booking?.ma_don_hang || '—',
      khach_san: booking?.loai_phong?.khach_san?.ten || '—',
      tong_tien: gross,
      ty_le_hoa_hong: Number(row.ty_le_hoa_hong) || 0,
      tien_hoa_hong: commission,
      tien_doi_tac_nhan: Math.max(0, gross - commission - refund),
      trang_thai: row.trang_thai,
      ngay_tinh: row.ngay_tinh,
      ngay_doi_soat: row.ngay_doi_soat,
    };
  });
};

const buildPayoutBucket = () => ({
  so_don: 0,
  tong_doanh_thu: 0,
  tong_hoa_hong: 0,
  tien_doi_tac_nhan: 0,
  da_nhan: 0,
  so_don_da_tt: 0,
  so_don_cho_tt: 0,
  ngay_thanh_toan: null,
  phuong_thuc: null,
  ma_gd_doi_tac: null,
});

const partnerAmountFromRow = (row) => {
  const gross = Number(row.dat_phong?.thanh_toan_cuoi) || 0;
  const commission = Number(row.so_tien_hoa_hong) || 0;
  const refund = row.dat_phong?.hoan_tien?.trang_thai === 'da_hoan'
    ? Number(row.dat_phong.hoan_tien.so_tien_hoan) || 0
    : 0;
  return {
    gross,
    commission,
    partnerAmount: Math.max(0, gross - commission - refund),
  };
};

const paidBatchKey = (row, doiTacId) => {
  if (row.ma_gd_doi_tac) return row.ma_gd_doi_tac;
  if (row.ngay_thanh_toan_doi_tac) {
    return `LEGACY-${doiTacId}-${new Date(row.ngay_thanh_toan_doi_tac).toISOString()}`;
  }
  return `LEGACY-${doiTacId}-${row.ma_hoa_hong}`;
};

/**
 * Danh sách thanh toán đối tác theo từng ĐỢT (chờ TT / đã TT).
 */
const getPayouts = async (doiTacId, query) => {
  const filters = parseFilters(query);

  const commissions = await prisma.hoa_hong.findMany({
    where: {
      ma_doi_tac: doiTacId,
      trang_thai: { in: ['da_thu', 'da_thanh_toan', 'tam_giu'] },
      ...(filters.dateFilter ? { ngay_tinh: filters.dateFilter } : {}),
      dat_phong: {
        loai_phong: {
          khach_san: partnerHotelWhere(doiTacId, filters.maKhachSan),
        },
      },
    },
    include: {
      dat_phong: {
        include: { hoan_tien: true },
      },
    },
    orderBy: { ngay_tinh: 'desc' },
  });

  const payoutRows = commissions.filter((r) => {
    if (r.trang_thai === 'tam_giu') return Boolean(r.ngay_doi_soat);
    return true;
  });

  let pending = null;
  const paidByBatch = new Map();
  let held = null;

  for (const row of payoutRows) {
    const { gross, commission, partnerAmount } = partnerAmountFromRow(row);

    if (row.trang_thai === 'da_thu') {
      if (!pending) pending = buildPayoutBucket();
      pending.so_don += 1;
      pending.so_don_cho_tt += 1;
      pending.tong_doanh_thu += gross;
      pending.tong_hoa_hong += commission;
      pending.tien_doi_tac_nhan += partnerAmount;
    } else if (row.trang_thai === 'da_thanh_toan') {
      const key = paidBatchKey(row, doiTacId);
      if (!paidByBatch.has(key)) {
        paidByBatch.set(key, {
          ...buildPayoutBucket(),
          batch_key: key,
          ma_gd_doi_tac: row.ma_gd_doi_tac || null,
        });
      }
      const b = paidByBatch.get(key);
      b.so_don += 1;
      b.so_don_da_tt += 1;
      b.tong_doanh_thu += gross;
      b.tong_hoa_hong += commission;
      b.tien_doi_tac_nhan += partnerAmount;
      b.da_nhan += partnerAmount;
      if (row.ngay_thanh_toan_doi_tac) {
        const paidAt = new Date(row.ngay_thanh_toan_doi_tac);
        if (!b.ngay_thanh_toan || paidAt > b.ngay_thanh_toan) b.ngay_thanh_toan = paidAt;
      }
      if (row.phuong_thuc_tt_doi_tac) b.phuong_thuc = row.phuong_thuc_tt_doi_tac;
      if (row.ma_gd_doi_tac) b.ma_gd_doi_tac = row.ma_gd_doi_tac;
    } else if (row.trang_thai === 'tam_giu') {
      if (!held) held = buildPayoutBucket();
      held.so_don += 1;
      held.tong_doanh_thu += gross;
      held.tong_hoa_hong += commission;
      held.tien_doi_tac_nhan += partnerAmount;
    }
  }

  const paidBatches = [...paidByBatch.values()].sort((a, b) => {
    const ta = a.ngay_thanh_toan ? new Date(a.ngay_thanh_toan).getTime() : 0;
    const tb = b.ngay_thanh_toan ? new Date(b.ngay_thanh_toan).getTime() : 0;
    return ta - tb;
  });
  paidBatches.forEach((b, idx) => {
    b.so_dot = idx + 1;
    b.ten_dot = `Đợt ${idx + 1}`;
  });

  const list = [];

  if (pending?.so_don) {
    list.push({
      ma_dot: 'pending',
      ma_gd_doi_tac: null,
      ma_ky_thanh_toan: '—',
      ten_dot: 'Đợt chờ thanh toán',
      so_dot: null,
      thang_nam: null,
      khoang_thoi_gian: null,
      so_don: pending.so_don,
      tong_doanh_thu: pending.tong_doanh_thu,
      tong_hoa_hong: pending.tong_hoa_hong,
      tien_doi_tac_nhan: pending.tien_doi_tac_nhan,
      da_nhan: 0,
      con_cho_nhan: pending.tien_doi_tac_nhan,
      so_tien_nhan: pending.tien_doi_tac_nhan,
      trang_thai: 'cho_thanh_toan',
      ngay_thanh_toan: null,
      phuong_thuc_tt: null,
    });
  }

  for (const b of paidBatches) {
    list.push({
      ma_dot: b.batch_key,
      ma_gd_doi_tac: b.ma_gd_doi_tac || null,
      ma_ky_thanh_toan: b.ma_gd_doi_tac || b.batch_key,
      ten_dot: b.ten_dot,
      so_dot: b.so_dot,
      thang_nam: b.ngay_thanh_toan
        ? monthKeyFromDate(b.ngay_thanh_toan)
        : null,
      khoang_thoi_gian: b.ngay_thanh_toan
        ? monthKeyFromDate(b.ngay_thanh_toan)
        : null,
      so_don: b.so_don,
      tong_doanh_thu: b.tong_doanh_thu,
      tong_hoa_hong: b.tong_hoa_hong,
      tien_doi_tac_nhan: b.tien_doi_tac_nhan,
      da_nhan: b.da_nhan,
      con_cho_nhan: 0,
      so_tien_nhan: b.tien_doi_tac_nhan,
      trang_thai: 'da_thanh_toan',
      ngay_thanh_toan: b.ngay_thanh_toan,
      phuong_thuc_tt: b.phuong_thuc,
    });
  }

  if (held?.so_don) {
    list.push({
      ma_dot: 'held',
      ma_gd_doi_tac: null,
      ma_ky_thanh_toan: '—',
      ten_dot: 'Đợt tạm giữ',
      so_dot: null,
      thang_nam: null,
      khoang_thoi_gian: null,
      so_don: held.so_don,
      tong_doanh_thu: held.tong_doanh_thu,
      tong_hoa_hong: held.tong_hoa_hong,
      tien_doi_tac_nhan: held.tien_doi_tac_nhan,
      da_nhan: 0,
      con_cho_nhan: 0,
      so_tien_nhan: held.tien_doi_tac_nhan,
      trang_thai: 'tam_giu',
      ngay_thanh_toan: null,
      phuong_thuc_tt: null,
    });
  }

  list.sort((a, b) => {
    if (a.trang_thai === 'cho_thanh_toan' && b.trang_thai !== 'cho_thanh_toan') return -1;
    if (b.trang_thai === 'cho_thanh_toan' && a.trang_thai !== 'cho_thanh_toan') return 1;
    const ta = a.ngay_thanh_toan ? new Date(a.ngay_thanh_toan).getTime() : 0;
    const tb = b.ngay_thanh_toan ? new Date(b.ngay_thanh_toan).getTime() : 0;
    return tb - ta;
  });

  return list;
};

const getPayoutDetail = async (doiTacId, maDot) => {
  if (!maDot) return null;

  const list = await getPayouts(doiTacId, {});
  const summary = list.find((x) => String(x.ma_dot) === String(maDot));
  if (!summary) return null;

  const commissions = await prisma.hoa_hong.findMany({
    where: {
      ma_doi_tac: doiTacId,
      trang_thai: { in: ['da_thu', 'da_thanh_toan', 'tam_giu'] },
    },
    include: {
      dat_phong: {
        include: {
          hoan_tien: true,
          loai_phong: {
            select: {
              ten_loai: true,
              khach_san: { select: { ten: true } },
            },
          },
        },
      },
    },
    orderBy: { ngay_tinh: 'asc' },
  });

  const matchRows = commissions.filter((c) => {
    if (maDot === 'pending') return c.trang_thai === 'da_thu';
    if (maDot === 'held') return c.trang_thai === 'tam_giu' && Boolean(c.ngay_doi_soat);
    if (c.trang_thai !== 'da_thanh_toan') return false;
    return paidBatchKey(c, doiTacId) === String(maDot);
  });

  const bookings = matchRows.map((c) => {
    const { gross, commission, partnerAmount } = partnerAmountFromRow(c);
    return {
      ma_dat_phong: c.dat_phong?.ma_dat_phong || null,
      ma_don_hang: c.dat_phong?.ma_don_hang || '—',
      khach_san: c.dat_phong?.loai_phong?.khach_san?.ten || '—',
      loai_phong: c.dat_phong?.loai_phong?.ten_loai || '—',
      ngay_hoan_thanh: c.dat_phong?.ngay_tra_phong || null,
      tong_tien: gross,
      tien_hoa_hong: commission,
      tien_doi_tac_nhan: partnerAmount,
      trang_thai: c.trang_thai,
      ma_gd_doi_tac: c.ma_gd_doi_tac || null,
      ngay_thanh_toan_doi_tac: c.ngay_thanh_toan_doi_tac || null,
    };
  });

  return {
    ...summary,
    tong_so_don: bookings.length,
    bookings,
  };
};

module.exports = {
  getDoiTacId,
  getHotels,
  getOverview,
  getRevenueBookings,
  getCommissions,
  getPayouts,
  getPayoutDetail,
};
