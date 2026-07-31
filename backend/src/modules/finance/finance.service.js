const prisma = require('../../config/prisma');
const {
  mapBankAccount,
  parsePayoutProofNote,
} = require('../../utils/bankAccountHelpers');
const {
  calculateCommissionBreakdown,
  DEFAULT_COMMISSION_RATE,
} = require('../../utils/commissionHelpers');

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

/** Đơn tính doanh thu đối tác: hoàn thành / check-in, hoặc hủy còn phí phạt */
const isRevenueBooking = (booking) => {
  if (!isPaid(booking) || isFullRefund(booking)) return false;
  if (['hoan_thanh', 'da_checkin'].includes(booking.trang_thai)) return true;
  if (isCancelled(booking)) {
    const rate = Number(booking.hoa_hong?.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE;
    const b = calculateCommissionBreakdown(booking, rate);
    return b.so_tien_hoa_hong > 0 || b.tien_doi_tac_nhan > 0;
  }
  return false;
};

const calcAmounts = (booking) => {
  const rate = Number(booking.hoa_hong?.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE;
  const breakdown = calculateCommissionBreakdown(booking, rate);
  const refund = booking.hoan_tien && ['cho_xu_ly', 'dang_xu_ly', 'da_hoan'].includes(booking.hoan_tien.trang_thai)
    ? Number(booking.hoan_tien.so_tien_hoan) || 0
    : 0;
  return {
    gross: breakdown.gmv_doi_tac,
    paidGross: Number(booking.thanh_toan_cuoi) || 0,
    commission: breakdown.so_tien_hoa_hong,
    troGia: breakdown.tien_tro_gia_san,
    refund,
    partnerNet: breakdown.tien_doi_tac_nhan,
    vat: breakdown.vat,
  };
};

const bookingInclude = {
  thanh_toan: true,
  hoa_hong: true,
  hoan_tien: true,
  khuyen_mai: {
    select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
  },
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

const TREND_KY = new Set(['ngay', 'thang', 'quy', 'nam']);

const parseTrendKy = (query = {}) => {
  const raw = String(query.ky || query.nhom || 'thang').toLowerCase();
  return TREND_KY.has(raw) ? raw : 'thang';
};

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const periodKeyFromDate = (value, ky) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (ky === 'ngay') {
    return `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (ky === 'quy') {
    return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  }
  if (ky === 'nam') {
    return String(y);
  }
  return `${y}-${String(m).padStart(2, '0')}`;
};

const formatPeriodLabel = (key, ky) => {
  if (ky === 'ngay') {
    const [y, m, d] = String(key).split('-');
    if (!y || !m || !d) return key;
    return `${d}/${m}`;
  }
  if (ky === 'quy') {
    const [y, q] = String(key).split('-');
    if (!y || !q) return key;
    return `${q}/${y}`;
  }
  if (ky === 'nam') return String(key);
  const [y, m] = String(key).split('-');
  if (!y || !m) return key;
  return `${m}/${y}`;
};

const listPeriodKeys = (fromDate, toDate, ky) => {
  const keys = [];
  if (ky === 'ngay') {
    const cursor = startOfDay(fromDate);
    const end = startOfDay(toDate);
    while (cursor <= end) {
      keys.push(periodKeyFromDate(cursor, 'ngay'));
      cursor.setDate(cursor.getDate() + 1);
    }
    return keys;
  }
  if (ky === 'quy') {
    const cursor = new Date(fromDate.getFullYear(), Math.floor(fromDate.getMonth() / 3) * 3, 1);
    const end = new Date(toDate.getFullYear(), Math.floor(toDate.getMonth() / 3) * 3, 1);
    while (cursor <= end) {
      keys.push(periodKeyFromDate(cursor, 'quy'));
      cursor.setMonth(cursor.getMonth() + 3);
    }
    return keys;
  }
  if (ky === 'nam') {
    for (let y = fromDate.getFullYear(); y <= toDate.getFullYear(); y += 1) {
      keys.push(String(y));
    }
    return keys;
  }
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (cursor <= end) {
    keys.push(periodKeyFromDate(cursor, 'thang'));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

const monthKeyFromDate = (value) => periodKeyFromDate(value, 'thang');

const getOverview = async (doiTacId, query) => {
  const filters = parseFilters(query);
  const trendKy = parseTrendKy(query);

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
            khuyen_mai: {
              select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
            },
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
  const trendSource = (trendBookings || bookings).filter(isRevenueBooking);

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
  let soDaDoiSoat = 0;
  let soChoDoiSoat = 0;
  let soCoLech = 0;

  commissions.forEach((row) => {
    const breakdown = calculateCommissionBreakdown(
      row.dat_phong,
      Number(row.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
    );
    const partnerAmount = breakdown.tien_doi_tac_nhan;

    if (row.trang_thai === 'da_thanh_toan') {
      daThanhToan += partnerAmount;
      soDaDoiSoat += 1;
    } else if (row.trang_thai === 'da_thu') {
      choThanhToan += partnerAmount;
      soDaDoiSoat += 1;
    } else if (row.trang_thai === 'chua_thu') {
      soChoDoiSoat += 1;
    } else if (row.trang_thai === 'tam_giu') {
      soCoLech += 1;
    }
  });

  const now = new Date();
  const trendStart = filters.dateFilter?.gte
    ? new Date(filters.dateFilter.gte)
    : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const trendEnd = filters.dateFilter?.lte
    ? new Date(filters.dateFilter.lte)
    : now;
  const periodKeys = listPeriodKeys(trendStart, trendEnd, trendKy);
  const periodTotals = new Map(periodKeys.map((key) => [key, {
    doanh_thu: 0,
    phi_san: 0,
    tien_nhan: 0,
    so_don: 0,
  }]));

  trendSource.forEach((booking) => {
    const key = periodKeyFromDate(booking.ngay_tra_phong || booking.ngay_dat, trendKy);
    if (!key || !periodTotals.has(key)) return;
    const amounts = calcAmounts(booking);
    const bucket = periodTotals.get(key);
    bucket.doanh_thu += amounts.gross;
    bucket.phi_san += amounts.commission;
    bucket.tien_nhan += amounts.partnerNet;
    bucket.so_don += 1;
  });

  const revenueTrend = periodKeys.map((key) => {
    const bucket = periodTotals.get(key) || {
      doanh_thu: 0,
      phi_san: 0,
      tien_nhan: 0,
      so_don: 0,
    };
    return {
      key,
      label: formatPeriodLabel(key, trendKy),
      doanh_thu: bucket.doanh_thu,
      phi_san: bucket.phi_san,
      tien_nhan: bucket.tien_nhan,
      so_don: bucket.so_don,
    };
  });

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

  const tongDonDoiSoat = soDaDoiSoat + soChoDoiSoat + soCoLech;

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
      ky: trendKy,
      revenue_trend: revenueTrend,
      reconciliation_status: {
        tong_don: tongDonDoiSoat,
        items: [
          { key: 'da_doi_soat', name: 'Đã đối soát', value: soDaDoiSoat, color: '#3C7363' },
          { key: 'cho_doi_soat', name: 'Chờ đối soát', value: soChoDoiSoat, color: '#f0a202' },
          { key: 'co_lech', name: 'Có lệch', value: soCoLech, color: '#d64545' },
        ],
      },
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
          khuyen_mai: {
            select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
          },
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
    const breakdown = calculateCommissionBreakdown(
      booking,
      Number(row.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
    );
    return {
      ma_hoa_hong: row.ma_hoa_hong,
      ma_dat_phong: booking?.ma_dat_phong || null,
      ma_don_hang: booking?.ma_don_hang || '—',
      khach_san: booking?.loai_phong?.khach_san?.ten || '—',
      tong_tien: breakdown.gmv_doi_tac,
      ty_le_hoa_hong: Number(row.ty_le_hoa_hong) || 0,
      tien_hoa_hong: breakdown.so_tien_hoa_hong,
      tien_tro_gia_san: breakdown.tien_tro_gia_san,
      tien_doi_tac_nhan: breakdown.tien_doi_tac_nhan,
      trang_thai: row.trang_thai,
      ngay_tinh: row.ngay_tinh,
      ngay_doi_soat: row.ngay_doi_soat,
    };
  });
};

const getCommissionById = async (doiTacId, id) => {
  const row = await prisma.hoa_hong.findFirst({
    where: {
      ma_hoa_hong: Number(id),
      ma_doi_tac: doiTacId,
    },
    include: {
      dat_phong: {
        select: {
          ma_dat_phong: true,
          ma_don_hang: true,
          thanh_toan_cuoi: true,
          tong_tien_goc: true,
          tien_giam: true,
          ngay_nhan_phong: true,
          ngay_tra_phong: true,
          trang_thai: true,
          ten_nguoi_nhan: true,
          sdt_nguoi_nhan: true,
          ghi_chu: true,
          khuyen_mai: {
            select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
          },
          hoan_tien: {
            select: {
              ma_hoan_tien: true,
              trang_thai: true,
              so_tien_hoan: true,
            },
          },
          khach_hang: {
            select: {
              ho_ten: true,
              nguoi_dung: { select: { email: true, so_dien_thoai: true } },
            },
          },
          loai_phong: {
            select: {
              ten_loai: true,
              khach_san: { select: { ma_khach_san: true, ten: true } },
            },
          },
        },
      },
    },
  });

  if (!row) return null;

  const booking = row.dat_phong;
  const breakdown = calculateCommissionBreakdown(
    booking,
    Number(row.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
  );

  return {
    ma_hoa_hong: row.ma_hoa_hong,
    ty_le_hoa_hong: Number(row.ty_le_hoa_hong) || 0,
    so_tien_hoa_hong: breakdown.so_tien_hoa_hong,
    tien_tro_gia_san: breakdown.tien_tro_gia_san,
    hoa_hong_rong: breakdown.hoa_hong_rong,
    doanh_thu_don: breakdown.gmv_doi_tac,
    tien_khach_tra: Number(booking?.thanh_toan_cuoi) || 0,
    tien_doi_tac_nhan: breakdown.tien_doi_tac_nhan,
    trang_thai: row.trang_thai,
    ngay_tinh: row.ngay_tinh,
    ngay_doi_soat: row.ngay_doi_soat,
    ngay_hoan_thanh: row.ngay_tinh || booking?.ngay_tra_phong || null,
    ghi_chu: row.ghi_chu || null,
    dat_phong: booking,
  };
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
  ngay_doi_soat: null,
  phuong_thuc: null,
  ma_gd_doi_tac: null,
  ghi_chu: null,
});

const partnerAmountFromRow = (row) => {
  const breakdown = calculateCommissionBreakdown(
    row.dat_phong,
    Number(row.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
  );
  return {
    gross: breakdown.gmv_doi_tac,
    commission: breakdown.so_tien_hoa_hong,
    partnerAmount: breakdown.tien_doi_tac_nhan,
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
      trang_thai: { in: ['da_thu', 'da_thanh_toan'] },
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
          khuyen_mai: {
            select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
          },
        },
      },
    },
    orderBy: { ngay_tinh: 'desc' },
  });

  const payoutRows = commissions;

  let pending = null;
  const paidByBatch = new Map();

  for (const row of payoutRows) {
    const { gross, commission, partnerAmount } = partnerAmountFromRow(row);

    if (row.trang_thai === 'da_thu') {
      if (!pending) pending = buildPayoutBucket();
      pending.so_don += 1;
      pending.so_don_cho_tt += 1;
      pending.tong_doanh_thu += gross;
      pending.tong_hoa_hong += commission;
      pending.tien_doi_tac_nhan += partnerAmount;
      if (row.ngay_doi_soat) {
        const ds = new Date(row.ngay_doi_soat);
        if (!pending.ngay_doi_soat || ds > pending.ngay_doi_soat) pending.ngay_doi_soat = ds;
      }
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
      if (row.ngay_doi_soat) {
        const ds = new Date(row.ngay_doi_soat);
        if (!b.ngay_doi_soat || ds > b.ngay_doi_soat) b.ngay_doi_soat = ds;
      }
      if (row.ngay_thanh_toan_doi_tac) {
        const paidAt = new Date(row.ngay_thanh_toan_doi_tac);
        if (!b.ngay_thanh_toan || paidAt > b.ngay_thanh_toan) b.ngay_thanh_toan = paidAt;
      }
      if (row.phuong_thuc_tt_doi_tac) b.phuong_thuc = row.phuong_thuc_tt_doi_tac;
      if (row.ma_gd_doi_tac) b.ma_gd_doi_tac = row.ma_gd_doi_tac;
      if (row.ghi_chu) b.ghi_chu = row.ghi_chu;
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
      ngay_doi_soat: pending.ngay_doi_soat,
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
      ngay_doi_soat: b.ngay_doi_soat,
      phuong_thuc_tt: b.phuong_thuc,
      ghi_chu: b.ghi_chu || null,
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

  const partner = await prisma.doi_tac.findUnique({
    where: { ma_doi_tac: doiTacId },
    select: {
      ten_cong_ty: true,
      so_tai_khoan: true,
      ten_chu_tai_khoan: true,
      ma_ngan_hang: true,
      ten_ngan_hang: true,
      logo_ngan_hang: true,
    },
  });

  const commissions = await prisma.hoa_hong.findMany({
    where: {
      ma_doi_tac: doiTacId,
      trang_thai: { in: ['da_thu', 'da_thanh_toan'] },
    },
    include: {
      dat_phong: {
        include: {
          hoan_tien: true,
          khach_hang: { select: { ho_ten: true } },
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
    if (c.trang_thai !== 'da_thanh_toan') return false;
    return paidBatchKey(c, doiTacId) === String(maDot);
  });

  const hotels = new Set();
  const bookings = matchRows.map((c) => {
    const { gross, commission, partnerAmount } = partnerAmountFromRow(c);
    const hotelName = c.dat_phong?.loai_phong?.khach_san?.ten;
    if (hotelName) hotels.add(hotelName);
    return {
      ma_dat_phong: c.dat_phong?.ma_dat_phong || null,
      ma_don_hang: c.dat_phong?.ma_don_hang || '—',
      khach_hang: c.dat_phong?.khach_hang?.ho_ten || c.dat_phong?.ten_nguoi_nhan || '—',
      khach_san: hotelName || '—',
      loai_phong: c.dat_phong?.loai_phong?.ten_loai || '—',
      ngay_nhan_phong: c.dat_phong?.ngay_nhan_phong || null,
      ngay_tra_phong: c.dat_phong?.ngay_tra_phong || null,
      ngay_hoan_thanh: c.dat_phong?.ngay_tra_phong || null,
      tong_tien: gross,
      ty_le_hoa_hong: Number(c.ty_le_hoa_hong) || 0,
      tien_hoa_hong: commission,
      tien_doi_tac_nhan: partnerAmount,
      trang_thai: c.trang_thai,
      ma_gd_doi_tac: c.ma_gd_doi_tac || null,
      ngay_doi_soat: c.ngay_doi_soat || null,
      ngay_thanh_toan_doi_tac: c.ngay_thanh_toan_doi_tac || null,
    };
  });

  const proof = parsePayoutProofNote(summary.ghi_chu || matchRows[0]?.ghi_chu);
  const isPaid = summary.trang_thai === 'da_thanh_toan';

  return {
    ...summary,
    ten_cong_ty: partner?.ten_cong_ty || null,
    tai_khoan_ngan_hang: mapBankAccount(partner),
    danh_sach_khach_san: [...hotels],
    ma_phieu_thanh_toan: isPaid ? (summary.ma_gd_doi_tac || summary.ma_dot) : null,
    minh_chung: isPaid
      ? {
        phuong_thuc: summary.phuong_thuc_tt || matchRows[0]?.phuong_thuc_tt_doi_tac || null,
        ma_giao_dich: proof.ma_gd_ngan_hang || null,
        ghi_chu: proof.noi_dung_chuyen_khoan || summary.ghi_chu || null,
        ky_thanh_toan: proof.ky_thanh_toan || null,
      }
      : {
        phuong_thuc: null,
        ma_giao_dich: null,
        ghi_chu: null,
        ky_thanh_toan: null,
      },
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
  getCommissionById,
  getPayouts,
  getPayoutDetail,
};
