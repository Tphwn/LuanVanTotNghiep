const prisma = require('../../../config/prisma');
const {
  resolveTransactionDisplayStatus,
  TX_DISPLAY_STATUS,
} = require('../../../utils/paymentMapper');
const {
  calculateCommissionBreakdown,
  DEFAULT_COMMISSION_RATE,
} = require('../../../utils/commissionHelpers');

const partnerAmountFromBooking = (booking, commissionRow) => {
  const breakdown = calculateCommissionBreakdown(
    booking,
    Number(commissionRow?.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
  );
  return {
    gross: Number(booking?.thanh_toan_cuoi) || 0,
    gmvPartner: breakdown.gmv_doi_tac,
    commission: breakdown.so_tien_hoa_hong,
    troGia: breakdown.tien_tro_gia_san,
    partnerNet: breakdown.tien_doi_tac_nhan,
    netCommission: breakdown.hoa_hong_rong,
  };
};

const mapPaymentRow = (tx) => {
  const trangThai = resolveTransactionDisplayStatus(tx);
  return {
    ma_thanh_toan: tx.ma_thanh_toan,
    ma_giao_dich: tx.ma_giao_dich || tx.ma_tham_chieu || `TT-${tx.ma_thanh_toan}`,
    ma_don_hang: tx.dat_phong?.ma_don_hang || '—',
    ma_dat_phong: tx.dat_phong?.ma_dat_phong || null,
    khach_san: tx.dat_phong?.loai_phong?.khach_san?.ten || '—',
    khach_hang: tx.dat_phong?.ten_nguoi_nhan || '—',
    so_tien: Number(tx.so_tien) || 0,
    trang_thai: trangThai,
    trang_thai_label: TX_DISPLAY_STATUS[trangThai] || trangThai,
    phuong_thuc: tx.phuong_thuc || tx.dat_phong?.phuong_thuc_tt || '—',
    thoi_gian: tx.thoi_gian,
  };
};

const paymentInclude = {
  dat_phong: {
    select: {
      ma_dat_phong: true,
      ma_don_hang: true,
      ten_nguoi_nhan: true,
      phuong_thuc_tt: true,
      trang_thai: true,
      hoan_tien: {
        select: { ma_hoan_tien: true, trang_thai: true, so_tien_hoan: true },
      },
      loai_phong: {
        select: {
          ten_loai: true,
          khach_san: { select: { ten: true } },
        },
      },
    },
  },
  hoan_tien: {
    select: { ma_hoan_tien: true, trang_thai: true, so_tien_hoan: true },
  },
};

const adminFinanceService = {
  getOverview: async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      revenueBookings,
      successPayments,
      pendingRefunds,
      commissions,
      hoaHongChoDoiSoat,
      todaySuccessCount,
      todayFailedCount,
      todaySuccessPayments,
      todayFailedPayments,
      pendingRefundRows,
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
          khuyen_mai: {
            select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
          },
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
        where: { trang_thai: { in: ['cho_xu_ly', 'dang_xu_ly'] }, so_tien_hoan: { gt: 0 } },
      }),
      prisma.hoa_hong.findMany({
        include: {
          doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true } },
          dat_phong: {
            include: {
              hoan_tien: true,
              khuyen_mai: {
                select: { ma_khuyen_mai: true, loai_nguon: true, ma_code: true },
              },
            },
          },
        },
      }),
      prisma.hoa_hong.count({ where: { trang_thai: 'chua_thu' } }),
      prisma.thanh_toan.count({
        where: {
          trang_thai: 'thanh_cong',
          thoi_gian: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.thanh_toan.count({
        where: {
          trang_thai: 'that_bai',
          thoi_gian: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.thanh_toan.findMany({
        where: {
          trang_thai: 'thanh_cong',
          thoi_gian: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { thoi_gian: 'desc' },
        take: 20,
        include: paymentInclude,
      }),
      prisma.thanh_toan.findMany({
        where: {
          trang_thai: 'that_bai',
          thoi_gian: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { thoi_gian: 'desc' },
        take: 20,
        include: paymentInclude,
      }),
      prisma.hoan_tien.findMany({
        where: { trang_thai: { in: ['cho_xu_ly', 'dang_xu_ly'] }, so_tien_hoan: { gt: 0 } },
        orderBy: { ngay_yeu_cau: 'desc' },
        take: 10,
        include: {
          dat_phong: {
            select: {
              ma_don_hang: true,
              ten_nguoi_nhan: true,
              loai_phong: {
                select: { khach_san: { select: { ten: true } } },
              },
            },
          },
        },
      }),
    ]);

    let tongDoanhThu = 0;
    let hoaHongHeThong = 0;
    let chiPhiTroGia = 0;

    revenueBookings.forEach((booking) => {
      const refund = booking.hoan_tien?.trang_thai === 'da_hoan'
        ? Number(booking.hoan_tien.so_tien_hoan) || 0
        : 0;
      const gross = Number(booking.thanh_toan_cuoi) || 0;
      if (refund >= gross * 0.99 && gross > 0) return;

      const rate = Number(booking.hoa_hong?.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE;
      const breakdown = calculateCommissionBreakdown(booking, rate);

      tongDoanhThu += gross;
      hoaHongHeThong += breakdown.so_tien_hoa_hong;
      chiPhiTroGia += breakdown.tien_tro_gia_san;
    });

    // Khớp tab Thanh toán ĐT: chờ TT = đã đối soát (da_thu), đã TT = da_thanh_toan
    let choThanhToanDoiTac = 0;
    let daThanhToanDoiTac = 0;
    const partnersChoTt = new Map();

    commissions.forEach((row) => {
      const { partnerNet, commission, troGia } = partnerAmountFromBooking(row.dat_phong, row);
      // Bổ sung đơn hủy có hoa hồng (không nằm trong revenueBookings hoàn thành)
      if (['da_huy', 'tu_choi'].includes(row.dat_phong?.trang_thai)) {
        hoaHongHeThong += commission;
        chiPhiTroGia += troGia;
        tongDoanhThu += Number(row.dat_phong?.thanh_toan_cuoi) || 0;
      }
      if (row.trang_thai === 'da_thanh_toan') {
        daThanhToanDoiTac += partnerNet;
      } else if (row.trang_thai === 'da_thu') {
        choThanhToanDoiTac += partnerNet;
        if (row.ma_doi_tac) {
          const prev = partnersChoTt.get(row.ma_doi_tac) || {
            ma_doi_tac: row.ma_doi_tac,
            ten: row.doi_tac?.ten_cong_ty || `Đối tác #${row.ma_doi_tac}`,
            so_tien: 0,
            so_don: 0,
          };
          prev.so_tien += partnerNet;
          prev.so_don += 1;
          partnersChoTt.set(row.ma_doi_tac, prev);
        }
      }
    });

    const doanhThuRongSan = hoaHongHeThong - chiPhiTroGia;

    const partnersChoList = Array.from(partnersChoTt.values())
      .sort((a, b) => b.so_tien - a.so_tien)
      .slice(0, 10);

    const refundPreview = pendingRefundRows.map((r) => ({
      ma_hoan_tien: r.ma_hoan_tien,
      ma_don_hang: r.dat_phong?.ma_don_hang || '—',
      khach_hang: r.dat_phong?.ten_nguoi_nhan || '—',
      khach_san: r.dat_phong?.loai_phong?.khach_san?.ten || '—',
      so_tien_hoan: Number(r.so_tien_hoan) || 0,
      ngay_yeu_cau: r.ngay_yeu_cau,
      trang_thai: r.trang_thai,
    }));

    const todaySuccessMapped = todaySuccessPayments.map(mapPaymentRow);
    const todayFailedMapped = todayFailedPayments.map(mapPaymentRow);

    return {
      cards: {
        tong_doanh_thu: tongDoanhThu,
        giao_dich_thanh_cong: successPayments,
        cho_hoan_tien: pendingRefunds,
        hoa_hong_he_thong: hoaHongHeThong,
        chi_phi_tro_gia: chiPhiTroGia,
        doanh_thu_rong_san: doanhThuRongSan,
        cho_thanh_toan_doi_tac: choThanhToanDoiTac,
        da_thanh_toan_doi_tac: daThanhToanDoiTac,
      },
      tong_doanh_thu: tongDoanhThu,
      tong_hoa_hong: hoaHongHeThong,
      chi_phi_tro_gia: chiPhiTroGia,
      tong_hoan_tien: 0,
      doanh_thu_thuc_nhan: doanhThuRongSan,
      so_don_thanh_cong: successPayments,
      so_don_hoan_tien: pendingRefunds,
      viec_hom_nay: {
        ngay: startOfDay.toISOString().slice(0, 10),
        doi_tac_cho_thanh_toan: {
          so_luong: partnersChoTt.size,
          so_tien: choThanhToanDoiTac,
          danh_sach: partnersChoList,
        },
        don_cho_hoan_tien: {
          so_luong: pendingRefunds,
          danh_sach: refundPreview,
        },
        hoa_hong_cho_doi_soat: {
          so_luong: hoaHongChoDoiSoat,
        },
        giao_dich_thanh_cong: {
          so_luong: todaySuccessCount,
          danh_sach: todaySuccessMapped,
        },
        giao_dich_that_bai: {
          so_luong: todayFailedCount,
          danh_sach: todayFailedMapped,
        },
      },
      can_xu_ly: {
        don_cho_hoan_tien: pendingRefunds,
        hoa_hong_cho_doi_soat: hoaHongChoDoiSoat,
        doi_tac_cho_thanh_toan: partnersChoTt.size,
        so_tien_cho_thanh_toan: choThanhToanDoiTac,
      },
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
