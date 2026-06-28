const prisma = require('../../../config/prisma');
const { mapTransaction, mapTransactions } = require('../../../utils/paymentMapper');
const { mapRefund, mapRefunds } = require('../../../utils/refundMapper');

const BOOKING_SELECT = {
  ma_dat_phong: true,
  ma_don_hang: true,
  ten_nguoi_nhan: true,
  sdt_nguoi_nhan: true,
  ngay_nhan_phong: true,
  ngay_tra_phong: true,
  thanh_toan_cuoi: true,
  loai_phong: {
    select: {
      ten_loai: true,
      khach_san: {
        select: {
          ten: true,
          doi_tac: { select: { ten_cong_ty: true } },
        },
      },
    },
  },
  khach_hang: {
    select: {
      ho_ten: true,
      nguoi_dung: { select: { email: true, so_dien_thoai: true } },
    },
  },
};

const REFUND_BOOKING_SELECT = {
  ma_dat_phong: true,
  ma_don_hang: true,
  ten_nguoi_nhan: true,
  sdt_nguoi_nhan: true,
  ngay_nhan_phong: true,
  ngay_tra_phong: true,
  so_khach: true,
  thanh_toan_cuoi: true,
  tong_tien_goc: true,
  tien_giam: true,
  phuong_thuc_tt: true,
  trang_thai: true,
  ghi_chu: true,
  ngay_dat: true,
  khach_hang: {
    select: {
      ho_ten: true,
      nguoi_dung: { select: { email: true, so_dien_thoai: true } },
    },
  },
  loai_phong: {
    select: {
      ten_loai: true,
      khach_san: {
        select: {
          ten: true,
          dia_chi: true,
          gio_nhan_phong: true,
          gio_tra_phong: true,
          doi_tac: { select: { ten_cong_ty: true } },
          chinh_sach_huy: {
            where: { trang_thai: 'hoat_dong' },
            orderBy: { so_ngay_truoc: 'desc' },
          },
        },
      },
    },
  },
};

const REFUND_INCLUDE = {
  dat_phong: { select: REFUND_BOOKING_SELECT },
  thanh_toan: {
    select: {
      ma_thanh_toan: true,
      ma_giao_dich: true,
      so_tien: true,
      phuong_thuc: true,
      cong_thanh_toan: true,
      trang_thai: true,
      thoi_gian: true,
    },
  },
  nguoi_dung: { select: { email: true } },
};

const adminPaymentService = {

  getStats: async () => {
    const [
      tongGiaoDich,
      tongDoanhThu,
      tongHoanTien,
      tongHoaHong,
      choXuLy,
    ] = await Promise.all([
      prisma.thanh_toan.count(),
      prisma.thanh_toan.aggregate({
        where: { trang_thai: 'thanh_cong' },
        _sum: { so_tien: true },
      }),
      prisma.hoan_tien.aggregate({
        where: { trang_thai: 'da_hoan' },
        _sum: { so_tien_hoan: true },
      }),
      prisma.hoa_hong.aggregate({
        _sum: { so_tien_hoa_hong: true },
      }),
      prisma.hoan_tien.count({ where: { trang_thai: 'cho_xu_ly' } }),
    ]);

    const now = new Date();
    const thangGanDay = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const agg = await prisma.thanh_toan.aggregate({
        where: {
          trang_thai: 'thanh_cong',
          thoi_gian: { gte: d, lte: end },
        },
        _sum: { so_tien: true },
      });
      thangGanDay.push({
        thang: `${d.getMonth() + 1}/${d.getFullYear()}`,
        doanh_thu: agg._sum.so_tien || 0,
      });
    }

    return {
      tong_giao_dich: tongGiaoDich,
      tong_doanh_thu: tongDoanhThu._sum.so_tien || 0,
      tong_hoan_tien: tongHoanTien._sum.so_tien_hoan || 0,
      tong_hoa_hong: tongHoaHong._sum.so_tien_hoa_hong || 0,
      cho_xu_ly_hoan: choXuLy,
      bieu_do_thang: thangGanDay,
    };
  },

  getTransactions: async (filters = {}) => {
    const { trang_thai, phuong_thuc, tu_ngay, den_ngay, keyword } = filters;
    const where = {};

    if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;

    if (phuong_thuc && phuong_thuc !== 'all') {
      if (phuong_thuc === 'tai_khach_san') {
        where.OR = [
          { cong_thanh_toan: { contains: 'khách sạn' } },
          { phuong_thuc: { contains: 'khách sạn' } },
          { dat_phong: { phuong_thuc_tt: 'tai_khach_san' } },
        ];
      } else if (phuong_thuc === 'truc_tuyen') {
        where.OR = [
          { phuong_thuc: { contains: 'Trực tuyến' } },
          { phuong_thuc: { contains: 'truc_tuyen' } },
          { dat_phong: { phuong_thuc_tt: 'truc_tuyen' } },
        ];
      }
    }

    if (tu_ngay) where.thoi_gian = { gte: new Date(tu_ngay) };
    if (den_ngay) where.thoi_gian = { ...where.thoi_gian, lte: new Date(`${den_ngay}T23:59:59`) };

    if (keyword) {
      const keywordFilter = {
        OR: [
          { ma_giao_dich: { contains: keyword } },
          { ma_tham_chieu: { contains: keyword } },
          { dat_phong: { ma_don_hang: { contains: keyword } } },
          { dat_phong: { khach_hang: { ho_ten: { contains: keyword } } } },
          { dat_phong: { ten_nguoi_nhan: { contains: keyword } } },
        ],
      };
      where.AND = where.AND ? [...where.AND, keywordFilter] : [keywordFilter];
    }

    const rows = await prisma.thanh_toan.findMany({
      where,
      include: { dat_phong: { select: BOOKING_SELECT } },
      orderBy: { thoi_gian: 'desc' },
    });

    return mapTransactions(rows);
  },

  getTransactionById: async (id) => {
    const row = await prisma.thanh_toan.findUnique({
      where: { ma_thanh_toan: Number(id) },
      include: {
        dat_phong: {
          include: {
            khach_hang: {
              select: {
                ho_ten: true,
                nguoi_dung: { select: { email: true, so_dien_thoai: true } },
              },
            },
            loai_phong: {
              include: {
                khach_san: {
                  select: {
                    ten: true,
                    dia_chi: true,
                    doi_tac: { select: { ten_cong_ty: true } },
                  },
                },
              },
            },
            khuyen_mai: true,
          },
        },
        hoan_tien: true,
      },
    });

    return mapTransaction(row);
  },

  getRefunds: async (filters = {}) => {
    const { trang_thai, tu_ngay, den_ngay, keyword } = filters;
    const where = {};
    if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
    if (tu_ngay) where.ngay_yeu_cau = { gte: new Date(tu_ngay) };
    if (den_ngay) where.ngay_yeu_cau = { ...where.ngay_yeu_cau, lte: new Date(`${den_ngay}T23:59:59`) };

    if (keyword?.trim()) {
      const keywordFilter = {
        OR: [
          { dat_phong: { ma_don_hang: { contains: keyword.trim() } } },
          { dat_phong: { khach_hang: { ho_ten: { contains: keyword.trim() } } } },
          { dat_phong: { ten_nguoi_nhan: { contains: keyword.trim() } } },
        ],
      };
      where.AND = where.AND ? [...where.AND, keywordFilter] : [keywordFilter];
    }

    const rows = await prisma.hoan_tien.findMany({
      where,
      include: REFUND_INCLUDE,
      orderBy: { ngay_yeu_cau: 'desc' },
    });

    return mapRefunds(rows);
  },

  getRefundById: async (id) => {
    const row = await prisma.hoan_tien.findUnique({
      where: { ma_hoan_tien: Number(id) },
      include: REFUND_INCLUDE,
    });

    return mapRefund(row);
  },

  approveRefund: async (id, adminId) => {
    const refund = await prisma.hoan_tien.findUnique({
      where: { ma_hoan_tien: Number(id) },
    });
    if (!refund) throw new Error('Không tìm thấy yêu cầu hoàn tiền');
    if (refund.trang_thai !== 'cho_xu_ly' && refund.trang_thai !== 'dang_xu_ly') {
      throw new Error('Yêu cầu này không thể duyệt');
    }
    await prisma.hoan_tien.update({
      where: { ma_hoan_tien: Number(id) },
      data: {
        trang_thai: 'da_hoan',
        xu_ly_boi_id: Number(adminId),
        ngay_xu_ly: new Date(),
      },
    });

    const row = await prisma.hoan_tien.findUnique({
      where: { ma_hoan_tien: Number(id) },
      include: REFUND_INCLUDE,
    });
    return mapRefund(row);
  },

  rejectRefund: async (id, adminId, ly_do) => {
    const refund = await prisma.hoan_tien.findUnique({
      where: { ma_hoan_tien: Number(id) },
    });
    if (!refund) throw new Error('Không tìm thấy yêu cầu hoàn tiền');
    if (!['cho_xu_ly', 'dang_xu_ly'].includes(refund.trang_thai)) {
      throw new Error('Yêu cầu này không thể từ chối');
    }
    return prisma.hoan_tien.update({
      where: { ma_hoan_tien: Number(id) },
      data: {
        trang_thai: 'tu_choi',
        ly_do,
        xu_ly_boi_id: Number(adminId),
        ngay_xu_ly: new Date(),
      },
    });
  },

  getCommissions: async (filters = {}) => {
    const { trang_thai, doi_tac_id } = filters;
    const where = {};
    if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
    if (doi_tac_id) where.ma_doi_tac = Number(doi_tac_id);

    return prisma.hoa_hong.findMany({
      where,
      include: {
        dat_phong: {
          select: {
            ma_don_hang: true,
            thanh_toan_cuoi: true,
            ngay_dat: true,
            loai_phong: {
              select: {
                ten_loai: true,
                khach_san: { select: { ten: true } },
              },
            },
          },
        },
        doi_tac: {
          select: {
            ten_cong_ty: true,
            ma_doi_tac: true,
          },
        },
      },
      orderBy: { ngay_tinh: 'desc' },
    });
  },

  getCommissionByPartner: async () => {
    const result = await prisma.hoa_hong.groupBy({
      by: ['ma_doi_tac'],
      _sum: { so_tien_hoa_hong: true },
      _count: { ma_hoa_hong: true },
    });

    const partners = await prisma.doi_tac.findMany({
      select: { ma_doi_tac: true, ten_cong_ty: true },
    });

    return result.map((r) => ({
      ...r,
      doi_tac: partners.find((p) => p.ma_doi_tac === r.ma_doi_tac),
    }));
  },

  confirmCommission: async (id) => {
    return prisma.hoa_hong.update({
      where: { ma_hoa_hong: Number(id) },
      data: { trang_thai: 'da_thu' },
    });
  },

  getPartnerPayments: async () => {
    const partners = await prisma.doi_tac.findMany({
      select: {
        ma_doi_tac: true,
        ten_cong_ty: true,
        khach_san: {
          select: {
            ma_khach_san: true,
            ten: true,
            loai_phong: {
              select: {
                dat_phong: {
                  where: { trang_thai: 'hoan_thanh' },
                  select: { thanh_toan_cuoi: true },
                },
              },
            },
          },
        },
        hoa_hong: {
          select: {
            so_tien_hoa_hong: true,
            trang_thai: true,
            ma_hoa_hong: true,
          },
        },
      },
    });

    return partners.map((p) => {
      const doanhThu = p.khach_san.reduce((sum, ks) => (
        sum + ks.loai_phong.reduce((s2, lp) => (
          s2 + lp.dat_phong.reduce((s3, dp) => s3 + Number(dp.thanh_toan_cuoi), 0)
        ), 0)
      ), 0);

      const tongHoaHong = p.hoa_hong.reduce((sum, hh) => sum + Number(hh.so_tien_hoa_hong), 0);
      const daThu = p.hoa_hong
        .filter((hh) => hh.trang_thai === 'da_thu')
        .reduce((sum, hh) => sum + Number(hh.so_tien_hoa_hong), 0);
      const chuaThu = tongHoaHong - daThu;

      return {
        ma_doi_tac: p.ma_doi_tac,
        ten_cong_ty: p.ten_cong_ty,
        so_ks: p.khach_san.length,
        doanh_thu: doanhThu,
        tong_hoa_hong: tongHoaHong,
        da_thu_hh: daThu,
        chua_thu_hh: chuaThu,
        thuc_nhan: doanhThu - tongHoaHong,
      };
    });
  },
};

module.exports = adminPaymentService;
