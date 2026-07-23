const prisma = require('../../../config/prisma');
const { mapTransaction, mapTransactions } = require('../../../utils/paymentMapper');
const { mapRefund, mapRefunds } = require('../../../utils/refundMapper');
const {
  syncEligibleCommissions,
  COMMISSION_STATUS,
} = require('../../../utils/commissionHelpers');

const mapCommissionRow = (row) => {
  if (!row) return null;
  const doanhThu = Number(row.dat_phong?.thanh_toan_cuoi) || 0;
  const tienHh = Number(row.so_tien_hoa_hong) || 0;
  const admin = row.doi_soat_boi;
  return {
    ...row,
    doanh_thu_don: doanhThu,
    tien_doi_tac_nhan: Math.max(0, doanhThu - tienHh),
    ngay_hoan_thanh: row.ngay_tinh || row.dat_phong?.ngay_tra_phong,
    admin_doi_soat: admin
      ? { ma_nguoi_dung: admin.ma_nguoi_dung, email: admin.email }
      : null,
  };
};

const enrichCommissionAudit = async (row) => {
  if (!row?.ma_hoa_hong) return row;
  try {
    const extras = await prisma.$queryRaw`
      SELECT ngay_doi_soat, doi_soat_boi_id, ghi_chu, ngay_thanh_toan_doi_tac,
             phuong_thuc_tt_doi_tac, ma_gd_doi_tac
      FROM hoa_hong
      WHERE ma_hoa_hong = ${Number(row.ma_hoa_hong)}
    `;
    const ex = extras?.[0] || {};
    let admin = row.doi_soat_boi || null;
    const adminId = ex.doi_soat_boi_id != null ? Number(ex.doi_soat_boi_id) : null;
    if (adminId && !admin) {
      admin = await prisma.nguoi_dung.findUnique({
        where: { ma_nguoi_dung: adminId },
        select: { ma_nguoi_dung: true, email: true },
      });
    }
    return {
      ...row,
      ngay_doi_soat: ex.ngay_doi_soat ?? row.ngay_doi_soat ?? null,
      doi_soat_boi_id: adminId ?? row.doi_soat_boi_id ?? null,
      ghi_chu: ex.ghi_chu ?? row.ghi_chu ?? null,
      ngay_thanh_toan_doi_tac: ex.ngay_thanh_toan_doi_tac ?? row.ngay_thanh_toan_doi_tac ?? null,
      phuong_thuc_tt_doi_tac: ex.phuong_thuc_tt_doi_tac ?? row.phuong_thuc_tt_doi_tac ?? null,
      ma_gd_doi_tac: ex.ma_gd_doi_tac ?? row.ma_gd_doi_tac ?? null,
      doi_soat_boi: admin,
    };
  } catch {
    return row;
  }
};

const buildCommissionWhere = (filters = {}) => {
  const {
    trang_thai,
    doi_tac_id,
    khach_san_id,
    tu_ngay,
    den_ngay,
  } = filters;
  const where = {};

  if (trang_thai && trang_thai !== 'all') {
    where.trang_thai = trang_thai;
  }
  if (doi_tac_id && doi_tac_id !== 'all') {
    where.ma_doi_tac = Number(doi_tac_id);
  }

  const bookingWhere = {};
  if (khach_san_id && khach_san_id !== 'all') {
    bookingWhere.loai_phong = { ma_khach_san: Number(khach_san_id) };
  }
  if (tu_ngay || den_ngay) {
    bookingWhere.ngay_tra_phong = {};
    if (tu_ngay) bookingWhere.ngay_tra_phong.gte = new Date(tu_ngay);
    if (den_ngay) {
      const end = new Date(den_ngay);
      end.setHours(23, 59, 59, 999);
      bookingWhere.ngay_tra_phong.lte = end;
    }
  }
  if (Object.keys(bookingWhere).length) {
    where.dat_phong = bookingWhere;
  }

  return where;
};

const COMMISSION_INCLUDE = {
  dat_phong: {
    select: {
      ma_dat_phong: true,
      ma_don_hang: true,
      thanh_toan_cuoi: true,
      tong_tien_goc: true,
      tien_giam: true,
      ngay_dat: true,
      ngay_nhan_phong: true,
      ngay_tra_phong: true,
      trang_thai: true,
      phuong_thuc_tt: true,
      ten_nguoi_nhan: true,
      sdt_nguoi_nhan: true,
      khach_hang: {
        select: {
          ho_ten: true,
          nguoi_dung: { select: { email: true, so_dien_thoai: true } },
        },
      },
      thanh_toan: {
        select: {
          ma_thanh_toan: true,
          trang_thai: true,
          so_tien: true,
          phuong_thuc: true,
          thoi_gian: true,
        },
      },
      loai_phong: {
        select: {
          ten_loai: true,
          khach_san: {
            select: {
              ma_khach_san: true,
              ten: true,
            },
          },
        },
      },
    },
  },
  doi_tac: {
    select: {
      ten_cong_ty: true,
      ma_doi_tac: true,
      phan_tram_hoa_hong: true,
    },
  },
};

const BOOKING_SELECT = {
  ma_dat_phong: true,
  ma_don_hang: true,
  ten_nguoi_nhan: true,
  sdt_nguoi_nhan: true,
  ngay_nhan_phong: true,
  ngay_tra_phong: true,
  thanh_toan_cuoi: true,
  trang_thai: true,
  phuong_thuc_tt: true,
  hoan_tien: {
    select: {
      ma_hoan_tien: true,
      trang_thai: true,
      so_tien_hoan: true,
    },
  },
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
      prisma.hoan_tien.count({
        where: { trang_thai: 'cho_xu_ly', so_tien_hoan: { gt: 0 } },
      }),
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
      include: {
        dat_phong: { select: BOOKING_SELECT },
        hoan_tien: {
          select: {
            ma_hoan_tien: true,
            trang_thai: true,
            so_tien_hoan: true,
          },
        },
      },
      orderBy: { thoi_gian: 'desc' },
    });

    const mapped = mapTransactions(rows);
    if (!trang_thai || trang_thai === 'all') return mapped;
    return mapped.filter((tx) => tx.trang_thai === trang_thai);
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
            hoan_tien: {
              select: {
                ma_hoan_tien: true,
                trang_thai: true,
                so_tien_hoan: true,
              },
            },
          },
        },
        hoan_tien: true,
      },
    });

    return mapTransaction(row);
  },

  getRefunds: async (filters = {}) => {
    const { syncMissingCancelRefunds } = require('../../../utils/refundHelpers');
    await syncMissingCancelRefunds(prisma, 50);

    const { trang_thai, tu_ngay, den_ngay, keyword } = filters;
    // Chỉ hiển thị đơn thực sự phải hoàn tiền (bỏ đơn hủy hoàn 0đ)
    const where = { so_tien_hoan: { gt: 0 } };
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
    await syncEligibleCommissions(100);

    const where = buildCommissionWhere(filters);
    const rows = await prisma.hoa_hong.findMany({
      where,
      include: COMMISSION_INCLUDE,
      orderBy: { ngay_tinh: 'desc' },
    });
    const enriched = await Promise.all(rows.map((r) => enrichCommissionAudit(r)));
    return enriched.map(mapCommissionRow);
  },

  getCommissionStats: async (filters = {}) => {
    await syncEligibleCommissions(100);
    const where = buildCommissionWhere(filters);

    const [all, choDoiSoat, daDoiSoat, tamGiu, revenueAgg, filterRows] = await Promise.all([
      prisma.hoa_hong.aggregate({
        where,
        _sum: { so_tien_hoa_hong: true },
        _count: { ma_hoa_hong: true },
      }),
      prisma.hoa_hong.count({
        where: { ...where, trang_thai: COMMISSION_STATUS.CHO_DOI_SOAT },
      }),
      prisma.hoa_hong.count({
        where: { ...where, trang_thai: COMMISSION_STATUS.DA_DOI_SOAT },
      }),
      prisma.hoa_hong.count({
        where: { ...where, trang_thai: COMMISSION_STATUS.TAM_GIU },
      }),
      prisma.hoa_hong.findMany({
        where,
        select: {
          so_tien_hoa_hong: true,
          dat_phong: { select: { thanh_toan_cuoi: true } },
        },
      }),
      prisma.hoa_hong.findMany({
        select: {
          ma_doi_tac: true,
          doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true } },
          dat_phong: {
            select: {
              loai_phong: {
                select: {
                  khach_san: { select: { ma_khach_san: true, ten: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const doanhThuHopLe = revenueAgg.reduce(
      (sum, r) => sum + (Number(r.dat_phong?.thanh_toan_cuoi) || 0),
      0,
    );

    const partnerMap = new Map();
    const hotelMap = new Map();
    filterRows.forEach((r) => {
      if (r.doi_tac?.ma_doi_tac) {
        partnerMap.set(r.doi_tac.ma_doi_tac, r.doi_tac.ten_cong_ty);
      }
      const ks = r.dat_phong?.loai_phong?.khach_san;
      if (ks?.ma_khach_san) {
        hotelMap.set(ks.ma_khach_san, {
          ma_khach_san: ks.ma_khach_san,
          ten: ks.ten,
          ma_doi_tac: r.ma_doi_tac || r.doi_tac?.ma_doi_tac || null,
        });
      }
    });

    return {
      tong_hoa_hong_he_thong: Number(all._sum.so_tien_hoa_hong) || 0,
      doanh_thu_hop_le: doanhThuHopLe,
      so_don_da_tinh: all._count.ma_hoa_hong || 0,
      cho_doi_soat: choDoiSoat,
      da_doi_soat: daDoiSoat,
      tam_giu: tamGiu,
      partners: [...partnerMap.entries()].map(([id, ten]) => ({ ma_doi_tac: id, ten_cong_ty: ten })),
      hotels: [...hotelMap.values()],
    };
  },

  getCommissionById: async (id) => {
    const row = await prisma.hoa_hong.findUnique({
      where: { ma_hoa_hong: Number(id) },
      include: COMMISSION_INCLUDE,
    });
    if (!row) throw new Error('Không tìm thấy hoa hồng');
    return mapCommissionRow(await enrichCommissionAudit(row));
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

  confirmCommission: async (id, adminId) => {
    const maHh = Number(id);
    const found = await prisma.hoa_hong.findUnique({
      where: { ma_hoa_hong: maHh },
    });
    if (!found) throw new Error('Không tìm thấy hoa hồng');
    if (found.trang_thai === COMMISSION_STATUS.DA_DOI_SOAT) {
      throw new Error('Hoa hồng đã được đối soát');
    }
    if (found.trang_thai === COMMISSION_STATUS.TAM_GIU) {
      throw new Error('Đơn đang tạm giữ — hãy bỏ tạm giữ trước khi đối soát');
    }

    await prisma.hoa_hong.update({
      where: { ma_hoa_hong: maHh },
      data: { trang_thai: COMMISSION_STATUS.DA_DOI_SOAT },
    });

    const adminVal = adminId ? Number(adminId) : null;
    await prisma.$executeRaw`
      UPDATE hoa_hong
      SET ngay_doi_soat = NOW(),
          doi_soat_boi_id = ${adminVal}
      WHERE ma_hoa_hong = ${maHh}
    `;

    const row = await prisma.hoa_hong.findUnique({
      where: { ma_hoa_hong: maHh },
      include: COMMISSION_INCLUDE,
    });
    return mapCommissionRow(await enrichCommissionAudit(row));
  },

  holdCommission: async (id, ghiChu) => {
    const maHh = Number(id);
    const found = await prisma.hoa_hong.findUnique({
      where: { ma_hoa_hong: maHh },
    });
    if (!found) throw new Error('Không tìm thấy hoa hồng');
    if (found.trang_thai === COMMISSION_STATUS.DA_THANH_TOAN) {
      throw new Error('Không thể tạm giữ đơn đã thanh toán đối tác');
    }
    if (found.trang_thai === COMMISSION_STATUS.TAM_GIU) {
      throw new Error('Đơn đã đang tạm giữ');
    }
    // Cho phép tạm giữ từ chờ đối soát hoặc đã đối soát (chờ thanh toán đối tác)
    if (![COMMISSION_STATUS.CHO_DOI_SOAT, COMMISSION_STATUS.DA_DOI_SOAT].includes(found.trang_thai)) {
      throw new Error('Trạng thái hiện tại không thể tạm giữ');
    }

    await prisma.hoa_hong.update({
      where: { ma_hoa_hong: maHh },
      data: { trang_thai: COMMISSION_STATUS.TAM_GIU },
    });

    const note = typeof ghiChu === 'string' ? ghiChu.trim() : '';
    if (note) {
      await prisma.$executeRaw`
        UPDATE hoa_hong SET ghi_chu = ${note} WHERE ma_hoa_hong = ${maHh}
      `;
    }

    const row = await prisma.hoa_hong.findUnique({
      where: { ma_hoa_hong: maHh },
      include: COMMISSION_INCLUDE,
    });
    return mapCommissionRow(await enrichCommissionAudit(row));
  },

  releaseCommissionHold: async (id) => {
    const found = await enrichCommissionAudit(
      await prisma.hoa_hong.findUnique({ where: { ma_hoa_hong: Number(id) } }),
    );
    if (!found) throw new Error('Không tìm thấy hoa hồng');
    if (found.trang_thai !== COMMISSION_STATUS.TAM_GIU) {
      throw new Error('Chỉ bỏ tạm giữ đối với đơn đang tạm giữ');
    }
    // Đã đối soát trước đó → trả về chờ thanh toán đối tác; chưa → chờ đối soát
    const nextStatus = found.ngay_doi_soat
      ? COMMISSION_STATUS.DA_DOI_SOAT
      : COMMISSION_STATUS.CHO_DOI_SOAT;
    const updated = await prisma.hoa_hong.update({
      where: { ma_hoa_hong: Number(id) },
      data: { trang_thai: nextStatus },
      include: COMMISSION_INCLUDE,
    });
    return mapCommissionRow(await enrichCommissionAudit(updated));
  },

  /**
   * Danh sách thanh toán đối tác — theo từng ĐỢT (chờ TT / đã TT).
   * Đối soát thêm đơn mới → tạo đợt chờ mới, không đổi trạng thái đợt đã thanh toán.
   */
  getPartnerPayouts: async (filters = {}) => {
    const {
      doi_tac_id,
      khach_san_id,
      trang_thai,
      tu_ngay,
      den_ngay,
    } = filters;

    const idRows = await prisma.$queryRaw`
      SELECT ma_hoa_hong FROM hoa_hong
      WHERE trang_thai IN ('da_thu', 'da_thanh_toan', 'tam_giu')
    `;
    const ids = (idRows || []).map((r) => Number(r.ma_hoa_hong)).filter(Boolean);
    if (!ids.length) return [];

    const where = { ma_hoa_hong: { in: ids } };
    if (doi_tac_id && doi_tac_id !== 'all') {
      where.ma_doi_tac = Number(doi_tac_id);
    }

    const bookingWhere = {};
    if (khach_san_id && khach_san_id !== 'all') {
      bookingWhere.loai_phong = { ma_khach_san: Number(khach_san_id) };
    }
    if (tu_ngay || den_ngay) {
      bookingWhere.ngay_tra_phong = {};
      if (tu_ngay) bookingWhere.ngay_tra_phong.gte = new Date(tu_ngay);
      if (den_ngay) {
        const end = new Date(den_ngay);
        end.setHours(23, 59, 59, 999);
        bookingWhere.ngay_tra_phong.lte = end;
      }
    }
    if (Object.keys(bookingWhere).length) {
      where.dat_phong = bookingWhere;
    }

    const rows = await prisma.hoa_hong.findMany({
      where,
      include: COMMISSION_INCLUDE,
      orderBy: { ngay_tinh: 'desc' },
    });

    const enriched = await Promise.all(rows.map((r) => enrichCommissionAudit(r)));
    const payoutRows = enriched.filter((r) => {
      if (r.trang_thai === COMMISSION_STATUS.TAM_GIU) return Boolean(r.ngay_doi_soat);
      return true;
    });

    // partnerMeta + buckets theo đợt
    const partnerMeta = new Map();
    const pendingByPartner = new Map();
    const paidByBatch = new Map();
    const heldByPartner = new Map();

    const ensureMeta = (r) => {
      const pid = r.ma_doi_tac;
      if (!partnerMeta.has(pid)) {
        partnerMeta.set(pid, {
          ma_doi_tac: pid,
          ten_cong_ty: r.doi_tac?.ten_cong_ty || `Đối tác #${pid}`,
          hotels: new Set(),
        });
      }
      const hotelId = r.dat_phong?.loai_phong?.khach_san?.ma_khach_san;
      if (hotelId) partnerMeta.get(pid).hotels.add(hotelId);
      return partnerMeta.get(pid);
    };

    const emptyBucket = () => ({
      so_don: 0,
      tong_doanh_thu: 0,
      tong_hoa_hong: 0,
      so_tien: 0,
      ngay_thanh_toan: null,
      phuong_thuc: null,
      ma_gd_doi_tac: null,
    });

    for (const r of payoutRows) {
      ensureMeta(r);
      const pid = r.ma_doi_tac;
      const doanhThu = Number(r.dat_phong?.thanh_toan_cuoi) || 0;
      const hh = Number(r.so_tien_hoa_hong) || 0;
      const partnerAmt = Math.max(0, doanhThu - hh);

      if (r.trang_thai === COMMISSION_STATUS.DA_DOI_SOAT || r.trang_thai === 'da_thu') {
        if (!pendingByPartner.has(pid)) pendingByPartner.set(pid, emptyBucket());
        const b = pendingByPartner.get(pid);
        b.so_don += 1;
        b.tong_doanh_thu += doanhThu;
        b.tong_hoa_hong += hh;
        b.so_tien += partnerAmt;
      } else if (r.trang_thai === 'da_thanh_toan' || r.trang_thai === COMMISSION_STATUS.DA_THANH_TOAN) {
        const maGd = r.ma_gd_doi_tac
          || (r.ngay_thanh_toan_doi_tac
            ? `LEGACY-${pid}-${new Date(r.ngay_thanh_toan_doi_tac).toISOString()}`
            : `LEGACY-${pid}-${r.ma_hoa_hong}`);
        const key = `${pid}::${maGd}`;
        if (!paidByBatch.has(key)) {
          paidByBatch.set(key, {
            ...emptyBucket(),
            ma_doi_tac: pid,
            ma_gd_doi_tac: r.ma_gd_doi_tac || null,
            batch_key: maGd,
          });
        }
        const b = paidByBatch.get(key);
        b.so_don += 1;
        b.tong_doanh_thu += doanhThu;
        b.tong_hoa_hong += hh;
        b.so_tien += partnerAmt;
        if (r.ngay_thanh_toan_doi_tac) {
          const paidAt = new Date(r.ngay_thanh_toan_doi_tac);
          if (!b.ngay_thanh_toan || paidAt > new Date(b.ngay_thanh_toan)) {
            b.ngay_thanh_toan = paidAt;
          }
        }
        if (r.phuong_thuc_tt_doi_tac) b.phuong_thuc = r.phuong_thuc_tt_doi_tac;
        if (r.ma_gd_doi_tac) b.ma_gd_doi_tac = r.ma_gd_doi_tac;
      } else if (r.trang_thai === COMMISSION_STATUS.TAM_GIU) {
        if (!heldByPartner.has(pid)) heldByPartner.set(pid, emptyBucket());
        const b = heldByPartner.get(pid);
        b.so_don += 1;
        b.tong_doanh_thu += doanhThu;
        b.tong_hoa_hong += hh;
        b.so_tien += partnerAmt;
      }
    }

    // Đánh số đợt đã TT theo từng đối tác (cũ → mới = đợt 1, 2, ...)
    const paidOrderByPartner = new Map();
    for (const b of paidByBatch.values()) {
      if (!paidOrderByPartner.has(b.ma_doi_tac)) paidOrderByPartner.set(b.ma_doi_tac, []);
      paidOrderByPartner.get(b.ma_doi_tac).push(b);
    }
    for (const [, batches] of paidOrderByPartner) {
      batches.sort((a, b) => {
        const ta = a.ngay_thanh_toan ? new Date(a.ngay_thanh_toan).getTime() : 0;
        const tb = b.ngay_thanh_toan ? new Date(b.ngay_thanh_toan).getTime() : 0;
        return ta - tb;
      });
      batches.forEach((b, idx) => {
        b.so_dot = idx + 1;
        b.ten_dot = `Đợt ${idx + 1}`;
      });
    }

    let list = [];

    for (const [pid, b] of pendingByPartner) {
      const meta = partnerMeta.get(pid);
      list.push({
        ma_dot: `pending-${pid}`,
        ma_gd_doi_tac: null,
        ten_dot: 'Đợt chờ thanh toán',
        so_dot: null,
        ma_doi_tac: pid,
        ten_cong_ty: meta?.ten_cong_ty || `Đối tác #${pid}`,
        so_khach_san: meta?.hotels.size || 0,
        so_don: b.so_don,
        so_don_da_doi_soat: b.so_don,
        so_don_cho_tt: b.so_don,
        so_don_da_tt: 0,
        so_don_tam_giu: 0,
        tong_doanh_thu: b.tong_doanh_thu,
        tong_hoa_hong: b.tong_hoa_hong,
        so_tien_can_thanh_toan: b.so_tien,
        so_tien_thanh_toan: b.so_tien,
        ngay_thanh_toan: null,
        phuong_thuc_tt: null,
        trang_thai: 'cho_thanh_toan',
      });
    }

    for (const b of paidByBatch.values()) {
      const meta = partnerMeta.get(b.ma_doi_tac);
      list.push({
        ma_dot: b.batch_key,
        ma_gd_doi_tac: b.ma_gd_doi_tac || null,
        ten_dot: b.ten_dot || 'Đợt đã thanh toán',
        so_dot: b.so_dot || null,
        ma_doi_tac: b.ma_doi_tac,
        ten_cong_ty: meta?.ten_cong_ty || `Đối tác #${b.ma_doi_tac}`,
        so_khach_san: meta?.hotels.size || 0,
        so_don: b.so_don,
        so_don_da_doi_soat: b.so_don,
        so_don_cho_tt: 0,
        so_don_da_tt: b.so_don,
        so_don_tam_giu: 0,
        tong_doanh_thu: b.tong_doanh_thu,
        tong_hoa_hong: b.tong_hoa_hong,
        so_tien_can_thanh_toan: 0,
        so_tien_thanh_toan: b.so_tien,
        ngay_thanh_toan: b.ngay_thanh_toan,
        phuong_thuc_tt: b.phuong_thuc,
        trang_thai: 'da_thanh_toan',
      });
    }

    for (const [pid, b] of heldByPartner) {
      const meta = partnerMeta.get(pid);
      list.push({
        ma_dot: `held-${pid}`,
        ma_gd_doi_tac: null,
        ten_dot: 'Đợt tạm giữ',
        so_dot: null,
        ma_doi_tac: pid,
        ten_cong_ty: meta?.ten_cong_ty || `Đối tác #${pid}`,
        so_khach_san: meta?.hotels.size || 0,
        so_don: b.so_don,
        so_don_da_doi_soat: b.so_don,
        so_don_cho_tt: 0,
        so_don_da_tt: 0,
        so_don_tam_giu: b.so_don,
        tong_doanh_thu: b.tong_doanh_thu,
        tong_hoa_hong: b.tong_hoa_hong,
        so_tien_can_thanh_toan: 0,
        so_tien_thanh_toan: b.so_tien,
        ngay_thanh_toan: null,
        phuong_thuc_tt: null,
        trang_thai: 'tam_giu',
      });
    }

    if (trang_thai && trang_thai !== 'all') {
      list = list.filter((x) => x.trang_thai === trang_thai);
    }

    list.sort((a, b) => {
      if (a.trang_thai === 'cho_thanh_toan' && b.trang_thai !== 'cho_thanh_toan') return -1;
      if (b.trang_thai === 'cho_thanh_toan' && a.trang_thai !== 'cho_thanh_toan') return 1;
      const nameCmp = String(a.ten_cong_ty).localeCompare(String(b.ten_cong_ty), 'vi');
      if (nameCmp !== 0) return nameCmp;
      const ta = a.ngay_thanh_toan ? new Date(a.ngay_thanh_toan).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.ngay_thanh_toan ? new Date(b.ngay_thanh_toan).getTime() : Number.MAX_SAFE_INTEGER;
      return tb - ta;
    });

    return list;
  },

  getPartnerPayoutStats: async (filters = {}) => {
    const list = await adminPaymentService.getPartnerPayouts({
      ...filters,
      trang_thai: 'all',
    });

    const tongCho = list.reduce((s, x) => s + (Number(x.so_tien_can_thanh_toan) || 0), 0);

    const paidIdRows = await prisma.$queryRaw`
      SELECT ma_hoa_hong FROM hoa_hong WHERE trang_thai = 'da_thanh_toan'
    `;
    const paidIds = (paidIdRows || []).map((r) => Number(r.ma_hoa_hong)).filter(Boolean);
    let tongDaThanhToan = 0;
    if (paidIds.length) {
      const paidRows = await prisma.hoa_hong.findMany({
        where: { ma_hoa_hong: { in: paidIds } },
        include: { dat_phong: { select: { thanh_toan_cuoi: true } } },
      });
      tongDaThanhToan = paidRows.reduce((s, r) => {
        const dt = Number(r.dat_phong?.thanh_toan_cuoi) || 0;
        const hh = Number(r.so_tien_hoa_hong) || 0;
        return s + Math.max(0, dt - hh);
      }, 0);
    }

    const heldCount = await prisma.$queryRaw`
      SELECT COUNT(*) AS cnt
      FROM hoa_hong
      WHERE trang_thai = 'tam_giu' AND ngay_doi_soat IS NOT NULL
    `;

    const partners = await prisma.doi_tac.findMany({
      select: { ma_doi_tac: true, ten_cong_ty: true },
      orderBy: { ten_cong_ty: 'asc' },
    });
    const hotels = await prisma.khach_san.findMany({
      select: { ma_khach_san: true, ten: true, ma_doi_tac: true },
      orderBy: { ten: 'asc' },
    });

    return {
      tong_cho_thanh_toan: tongCho,
      tong_da_thanh_toan: tongDaThanhToan,
      so_doi_tac_cho: new Set(
        list.filter((x) => x.trang_thai === 'cho_thanh_toan').map((x) => x.ma_doi_tac),
      ).size,
      so_dot_da_thanh_toan: list.filter((x) => x.trang_thai === 'da_thanh_toan').length,
      so_ky_tam_giu: Number(heldCount?.[0]?.cnt || 0),
      partners,
      hotels,
    };
  },

  getPartnerPayoutById: async (maDoiTac) => {
    const batches = await adminPaymentService.getPartnerPayouts({
      doi_tac_id: maDoiTac,
      trang_thai: 'all',
    });
    if (!batches.length) throw new Error('Không có dữ liệu thanh toán cho đối tác này');

    const partnerId = Number(maDoiTac);
    const idRows = await prisma.$queryRaw`
      SELECT ma_hoa_hong FROM hoa_hong
      WHERE ma_doi_tac = ${partnerId}
        AND trang_thai IN ('da_thu', 'da_thanh_toan', 'tam_giu')
    `;
    const ids = (idRows || []).map((r) => Number(r.ma_hoa_hong)).filter(Boolean);
    const rows = ids.length
      ? await prisma.hoa_hong.findMany({
        where: { ma_hoa_hong: { in: ids } },
        include: COMMISSION_INCLUDE,
        orderBy: { ngay_tinh: 'desc' },
      })
      : [];
    const enriched = await Promise.all(rows.map((r) => enrichCommissionAudit(r)));
    const commissions = enriched
      .filter((r) => r.trang_thai !== COMMISSION_STATUS.TAM_GIU || r.ngay_doi_soat)
      .map(mapCommissionRow);

    const maGdToDot = new Map();
    for (const b of batches) {
      if (b.trang_thai === 'da_thanh_toan' && (b.ma_gd_doi_tac || b.ma_dot)) {
        maGdToDot.set(b.ma_gd_doi_tac || b.ma_dot, {
          ten_dot: b.ten_dot,
          so_dot: b.so_dot,
        });
      }
    }

    let daNhan = 0;
    let conChoNhan = 0;
    let tienDoiTacNhan = 0;
    let tongDoanhThu = 0;
    let tongHoaHong = 0;
    let ngayThanhToan = null;
    let soDonDaTt = 0;
    let soDonChoTt = 0;
    let soDonTamGiu = 0;
    const hotels = new Set();

    const bookings = commissions.map((c) => {
      const tongTien = Number(c.doanh_thu_don) || Number(c.dat_phong?.thanh_toan_cuoi) || 0;
      const tienHh = Number(c.so_tien_hoa_hong) || 0;
      const partnerAmount = Number(c.tien_doi_tac_nhan) || Math.max(0, tongTien - tienHh);
      tienDoiTacNhan += partnerAmount;
      tongDoanhThu += tongTien;
      tongHoaHong += tienHh;

      const hotelId = c.dat_phong?.loai_phong?.khach_san?.ma_khach_san;
      if (hotelId) hotels.add(hotelId);

      let tenDot = null;
      let soDot = null;
      if (c.trang_thai === 'da_thanh_toan' || c.trang_thai === COMMISSION_STATUS.DA_THANH_TOAN) {
        daNhan += partnerAmount;
        soDonDaTt += 1;
        if (c.ngay_thanh_toan_doi_tac) {
          const paidAt = new Date(c.ngay_thanh_toan_doi_tac);
          if (!ngayThanhToan || paidAt > new Date(ngayThanhToan)) ngayThanhToan = paidAt;
        }
        const maGd = c.ma_gd_doi_tac
          || (c.ngay_thanh_toan_doi_tac
            ? `LEGACY-${partnerId}-${new Date(c.ngay_thanh_toan_doi_tac).toISOString()}`
            : null);
        const meta = maGd ? maGdToDot.get(maGd) : null;
        tenDot = meta?.ten_dot || null;
        soDot = meta?.so_dot ?? null;
      } else if (c.trang_thai === 'da_thu' || c.trang_thai === COMMISSION_STATUS.DA_DOI_SOAT) {
        conChoNhan += partnerAmount;
        soDonChoTt += 1;
        tenDot = 'Đợt chờ thanh toán';
      } else if (c.trang_thai === COMMISSION_STATUS.TAM_GIU) {
        soDonTamGiu += 1;
        tenDot = 'Đợt tạm giữ';
      }

      return {
        ma_hoa_hong: c.ma_hoa_hong,
        ma_dat_phong: c.dat_phong?.ma_dat_phong || null,
        ma_don_hang: c.dat_phong?.ma_don_hang || '—',
        khach_san: c.dat_phong?.loai_phong?.khach_san?.ten || '—',
        loai_phong: c.dat_phong?.loai_phong?.ten_loai || '—',
        ngay_hoan_thanh: c.dat_phong?.ngay_tra_phong || c.ngay_hoan_thanh || null,
        tong_tien: tongTien,
        tien_hoa_hong: tienHh,
        tien_doi_tac_nhan: partnerAmount,
        trang_thai: c.trang_thai,
        ma_gd_doi_tac: c.ma_gd_doi_tac || null,
        ngay_thanh_toan_doi_tac: c.ngay_thanh_toan_doi_tac || null,
        ten_dot: tenDot,
        so_dot: soDot,
      };
    });

    let trangThai = 'da_thanh_toan';
    if (soDonChoTt > 0 && soDonDaTt > 0) trangThai = 'thanh_toan_mot_phan';
    else if (soDonChoTt > 0) trangThai = 'cho_thanh_toan';
    else if (soDonTamGiu > 0 && soDonDaTt === 0) trangThai = 'tam_giu';

    const first = batches[0];
    return {
      ma_doi_tac: partnerId,
      ten_cong_ty: first.ten_cong_ty,
      so_khach_san: hotels.size || first.so_khach_san || 0,
      so_don_da_doi_soat: bookings.length,
      so_don_cho_tt: soDonChoTt,
      so_don_da_tt: soDonDaTt,
      so_don_tam_giu: soDonTamGiu,
      tong_doanh_thu: tongDoanhThu,
      tong_hoa_hong: tongHoaHong,
      so_tien_can_thanh_toan: conChoNhan,
      trang_thai: trangThai,
      tong_so_don: bookings.length,
      tien_doi_tac_nhan: tienDoiTacNhan,
      da_nhan: daNhan,
      con_cho_nhan: conChoNhan,
      ngay_thanh_toan: ngayThanhToan,
      batches,
      commissions,
      bookings,
    };
  },

  confirmPartnerPayout: async (maDoiTac, payload = {}) => {
    const partnerId = Number(maDoiTac);
    if (!partnerId || Number.isNaN(partnerId)) {
      throw new Error('Mã đối tác không hợp lệ');
    }

    const pendingRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS cnt FROM hoa_hong
      WHERE ma_doi_tac = ${partnerId} AND trang_thai = 'da_thu'
    `;
    const pending = Number(pendingRows?.[0]?.cnt || 0);

    if (!pending) {
      const paidRows = await prisma.$queryRaw`
        SELECT COUNT(*) AS cnt FROM hoa_hong
        WHERE ma_doi_tac = ${partnerId} AND trang_thai = 'da_thanh_toan'
      `;
      if (Number(paidRows?.[0]?.cnt || 0) > 0) {
        return adminPaymentService.getPartnerPayoutById(partnerId);
      }
      throw new Error('Không có đơn chờ thanh toán cho đối tác này. Hãy đối soát hoa hồng trước.');
    }

    const methodMap = {
      chuyen_khoan: 'Chuyển khoản ngân hàng',
      tien_mat: 'Tiền mặt',
      khac: 'Khác',
    };
    const methodKey = payload.phuong_thuc || 'chuyen_khoan';
    const phuongThuc = methodMap[methodKey] || String(payload.phuong_thuc || 'Chuyển khoản ngân hàng');
    const ghiChu = payload.ghi_chu ? String(payload.ghi_chu).trim() : null;

    // Mã thanh toán riêng cho mỗi đợt (đối soát → thanh toán một lần)
    const maGd = `TT-${partnerId}-${Date.now()}`;

    await prisma.$executeRaw`
      UPDATE hoa_hong
      SET trang_thai = 'da_thanh_toan',
          ngay_thanh_toan_doi_tac = NOW(),
          phuong_thuc_tt_doi_tac = ${phuongThuc},
          ma_gd_doi_tac = ${maGd},
          ghi_chu = ${ghiChu}
      WHERE ma_doi_tac = ${partnerId}
        AND trang_thai = 'da_thu'
    `;

    return adminPaymentService.getPartnerPayoutById(partnerId);
  },

  releasePartnerPayoutHold: async (maDoiTac) => {
    const held = await prisma.$queryRaw`
      SELECT ma_hoa_hong FROM hoa_hong
      WHERE ma_doi_tac = ${Number(maDoiTac)}
        AND trang_thai = 'tam_giu'
        AND ngay_doi_soat IS NOT NULL
    `;
    if (!held?.length) {
      throw new Error('Đối tác không có kỳ thanh toán đang tạm giữ');
    }

    await prisma.hoa_hong.updateMany({
      where: {
        ma_hoa_hong: { in: held.map((x) => Number(x.ma_hoa_hong)) },
      },
      data: { trang_thai: COMMISSION_STATUS.DA_DOI_SOAT },
    });

    return adminPaymentService.getPartnerPayoutById(maDoiTac);
  },

  /** @deprecated dùng getPartnerPayouts */
  getPartnerPayments: async () => adminPaymentService.getPartnerPayouts({ trang_thai: 'all' }),
};

module.exports = adminPaymentService;
