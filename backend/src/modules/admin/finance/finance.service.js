const prisma = require('../../../config/prisma');

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

const partnerAmountFromBooking = (booking, commissionRow) => {
  const gross = Number(booking?.thanh_toan_cuoi) || 0;
  const commission = Number(commissionRow?.so_tien_hoa_hong) || 0;
  const refund = booking?.hoan_tien?.trang_thai === 'da_hoan'
    ? Number(booking.hoan_tien.so_tien_hoan) || 0
    : 0;
  return {
    gross,
    commission,
    partnerNet: Math.max(0, gross - commission - refund),
  };
};

const adminFinanceService = {
  getOverview: async () => {
    const now = new Date();
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      revenueBookings,
      successPayments,
      pendingRefunds,
      commissions,
      recentPayments,
      hoaHongChoDoiSoat,
    ] = await Promise.all([
      prisma.dat_phong.findMany({
        where: {
          trang_thai: { in: ['hoan_thanh', 'da_checkin'] },
          OR: [
            { thanh_toan: { trang_thai: 'thanh_cong' } },
            {
              phuong_thuc_tt: 'tai_khach_san',
              trang_thai: 'hoan_thanh',
            },
          ],
        },
        include: {
          thanh_toan: true,
          hoan_tien: true,
          hoa_hong: true,
          loai_phong: {
            select: {
              khach_san: {
                select: {
                  ma_khach_san: true,
                  ten: true,
                  ma_doi_tac: true,
                  doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true } },
                },
              },
            },
          },
        },
      }),
      prisma.thanh_toan.count({ where: { trang_thai: 'thanh_cong' } }),
      prisma.hoan_tien.count({
        where: { trang_thai: 'cho_xu_ly', so_tien_hoan: { gt: 0 } },
      }),
      prisma.hoa_hong.findMany({
        include: {
          doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true } },
          dat_phong: {
            include: {
              hoan_tien: true,
            },
          },
        },
      }),
      prisma.thanh_toan.findMany({
        take: 8,
        orderBy: { thoi_gian: 'desc' },
        include: {
          dat_phong: {
            select: {
              ma_dat_phong: true,
              ma_don_hang: true,
              ten_nguoi_nhan: true,
              phuong_thuc_tt: true,
              loai_phong: {
                select: {
                  ten_loai: true,
                  khach_san: { select: { ten: true } },
                },
              },
            },
          },
        },
      }),
      prisma.hoa_hong.count({ where: { trang_thai: 'chua_thu' } }),
    ]);

    let tongDoanhThu = 0;
    let hoaHongHeThong = 0;
    const partnerMap = new Map();
    const monthTotals = new Map(
      listMonthKeys(trendStart, now).map((key) => [key, 0]),
    );

    revenueBookings.forEach((booking) => {
      const refund = booking.hoan_tien?.trang_thai === 'da_hoan'
        ? Number(booking.hoan_tien.so_tien_hoan) || 0
        : 0;
      const gross = Number(booking.thanh_toan_cuoi) || 0;
      if (refund >= gross * 0.99 && gross > 0) return;

      const commission = booking.hoa_hong
        ? Number(booking.hoa_hong.so_tien_hoa_hong) || 0
        : 0;

      tongDoanhThu += gross;
      hoaHongHeThong += commission;

      const monthKey = monthKeyFromDate(
        booking.trang_thai === 'hoan_thanh'
          ? (booking.ngay_tra_phong || booking.ngay_dat)
          : booking.ngay_dat,
      );
      if (monthKey && monthTotals.has(monthKey)) {
        monthTotals.set(monthKey, monthTotals.get(monthKey) + gross);
      }

      const partner = booking.loai_phong?.khach_san?.doi_tac;
      const partnerId = partner?.ma_doi_tac
        || booking.loai_phong?.khach_san?.ma_doi_tac;
      if (partnerId) {
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            ma_doi_tac: partnerId,
            ten: partner?.ten_cong_ty || `Đối tác #${partnerId}`,
            doanh_thu: 0,
          });
        }
        partnerMap.get(partnerId).doanh_thu += gross;
      }
    });

    // Khớp tab Thanh toán ĐT: chờ TT = đã đối soát (da_thu), đã TT = da_thanh_toan
    let choThanhToanDoiTac = 0;
    let daThanhToanDoiTac = 0;
    const partnersChoTt = new Set();

    commissions.forEach((row) => {
      const { partnerNet } = partnerAmountFromBooking(row.dat_phong, row);
      if (row.trang_thai === 'da_thanh_toan') {
        daThanhToanDoiTac += partnerNet;
      } else if (row.trang_thai === 'da_thu') {
        choThanhToanDoiTac += partnerNet;
        if (row.ma_doi_tac) partnersChoTt.add(row.ma_doi_tac);
      }
    });

    const revenueTrend = listMonthKeys(trendStart, now).map((thang) => ({
      thang,
      label: formatMonthShort(thang),
      doanh_thu: monthTotals.get(thang) || 0,
    }));

    const revenueByPartner = Array.from(partnerMap.values())
      .sort((a, b) => b.doanh_thu - a.doanh_thu)
      .slice(0, 8);

    const TX_STATUS_LABEL = {
      cho: 'Chờ',
      thanh_cong: 'Thành công',
      that_bai: 'Thất bại',
    };

    const recentTransactions = recentPayments.map((tx) => ({
      ma_thanh_toan: tx.ma_thanh_toan,
      ma_giao_dich: tx.ma_giao_dich || tx.ma_tham_chieu || `TT-${tx.ma_thanh_toan}`,
      ma_don_hang: tx.dat_phong?.ma_don_hang || '—',
      ma_dat_phong: tx.dat_phong?.ma_dat_phong || null,
      khach_san: tx.dat_phong?.loai_phong?.khach_san?.ten || '—',
      khach_hang: tx.dat_phong?.ten_nguoi_nhan || '—',
      so_tien: Number(tx.so_tien) || 0,
      trang_thai: tx.trang_thai,
      trang_thai_label: TX_STATUS_LABEL[tx.trang_thai] || tx.trang_thai,
      phuong_thuc: tx.phuong_thuc || tx.dat_phong?.phuong_thuc_tt || '—',
      thoi_gian: tx.thoi_gian,
    }));

    return {
      cards: {
        tong_doanh_thu: tongDoanhThu,
        giao_dich_thanh_cong: successPayments,
        cho_hoan_tien: pendingRefunds,
        hoa_hong_he_thong: hoaHongHeThong,
        cho_thanh_toan_doi_tac: choThanhToanDoiTac,
        da_thanh_toan_doi_tac: daThanhToanDoiTac,
      },
      tong_doanh_thu: tongDoanhThu,
      tong_hoa_hong: hoaHongHeThong,
      tong_hoan_tien: 0,
      doanh_thu_thuc_nhan: hoaHongHeThong,
      so_don_thanh_cong: successPayments,
      so_don_hoan_tien: pendingRefunds,
      charts: {
        revenue_trend: revenueTrend,
        // Donut khớp số liệu ô thống kê (không còn nhầm “tổng phần ĐT” với “cần TT”)
        finance_split: [
          { name: 'Hoa hồng hệ thống', value: hoaHongHeThong },
          { name: 'Đã thanh toán đối tác', value: daThanhToanDoiTac },
          { name: 'Chờ thanh toán đối tác', value: choThanhToanDoiTac },
        ],
        revenue_by_partner: revenueByPartner,
      },
      can_xu_ly: {
        don_cho_hoan_tien: pendingRefunds,
        hoa_hong_cho_doi_soat: hoaHongChoDoiSoat,
        doi_tac_cho_thanh_toan: partnersChoTt.size,
        so_tien_cho_thanh_toan: choThanhToanDoiTac,
      },
      recent_transactions: recentTransactions,
    };
  },

  getCommissions: async () => {
    return prisma.hoa_hong.findMany({
      include: {
        doi_tac: true,
        dat_phong: {
          include: {
            khach_hang: true,
            loai_phong: { include: { khach_san: true } },
          },
        },
      },
      orderBy: { ngay_tinh: 'desc' },
    });
  },

  getCommissionStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const calc = async (date) => {
      const res = await prisma.hoa_hong.aggregate({
        _sum: { so_tien_hoa_hong: true },
        where: { ngay_tinh: { gte: date }, trang_thai: 'da_thu' },
      });
      return res._sum.so_tien_hoa_hong || 0;
    };

    return {
      hom_nay: await calc(today),
      thang_nay: await calc(firstDayOfMonth),
      nam_nay: await calc(firstDayOfYear),
    };
  },
};

module.exports = adminFinanceService;
