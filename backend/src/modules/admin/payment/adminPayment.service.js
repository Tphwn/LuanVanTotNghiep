const prisma = require('../../../config/prisma');
const { mapTransaction, mapTransactions } = require('../../../utils/paymentMapper');
const { mapRefund, mapRefunds } = require('../../../utils/refundMapper');
const {
  syncEligibleCommissions,
  COMMISSION_STATUS,
  calculateCommissionBreakdown,
  DEFAULT_COMMISSION_RATE,
} = require('../../../utils/commissionHelpers');
const {
  expireUnpaidOnlineHolds,
  purgeCancelledUnpaidBookings,
} = require('../../../utils/unpaidBookingCleanup');
const {
  mapBankAccount,
  hasCompleteBankAccount,
  parsePayoutProofNote,
} = require('../../../utils/bankAccountHelpers');

const mapCommissionRow = (row) => {
  if (!row) return null;
  const breakdown = calculateCommissionBreakdown(
    row.dat_phong,
    Number(row.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
  );
  const admin = row.doi_soat_boi;
  return {
    ...row,
    so_tien_hoa_hong: breakdown.so_tien_hoa_hong,
    tien_tro_gia_san: breakdown.tien_tro_gia_san,
    hoa_hong_rong: breakdown.hoa_hong_rong,
    doanh_thu_don: breakdown.gmv_doi_tac,
    tien_khach_tra: Number(row.dat_phong?.thanh_toan_cuoi) || 0,
    tien_doi_tac_nhan: breakdown.tien_doi_tac_nhan,
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
    await expireUnpaidOnlineHolds(prisma);
    await purgeCancelledUnpaidBookings(prisma);

    const { trang_thai, phuong_thuc, tu_ngay, den_ngay, keyword } = filters;
    const and = [
      {
        OR: [
          { trang_thai: { in: ['thanh_cong', 'that_bai'] } },
          {
            trang_thai: 'cho',
            dat_phong: { trang_thai: { notIn: ['da_huy', 'tu_choi'] } },
          },
        ],
      },
    ];

    if (phuong_thuc && phuong_thuc !== 'all') {
      if (phuong_thuc === 'vnpay') {
        and.push({
          OR: [
            { cong_thanh_toan: { contains: 'VNPay' } },
            { cong_thanh_toan: { contains: 'vnpay' } },
          ],
        });
      } else if (phuong_thuc === 'momo') {
        and.push({
          OR: [
            { cong_thanh_toan: { contains: 'MoMo' } },
            { cong_thanh_toan: { contains: 'momo' } },
          ],
        });
      }
    }

    if (tu_ngay || den_ngay) {
      const thoiGian = {};
      if (tu_ngay) thoiGian.gte = new Date(tu_ngay);
      if (den_ngay) thoiGian.lte = new Date(`${den_ngay}T23:59:59`);
      and.push({ thoi_gian: thoiGian });
    }

    if (keyword) {
      and.push({
        OR: [
          { ma_giao_dich: { contains: keyword } },
          { ma_tham_chieu: { contains: keyword } },
          { dat_phong: { ma_don_hang: { contains: keyword } } },
          { dat_phong: { khach_hang: { ho_ten: { contains: keyword } } } },
          { dat_phong: { ten_nguoi_nhan: { contains: keyword } } },
        ],
      });
    }

    const rows = await prisma.thanh_toan.findMany({
      where: { AND: and },
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
    if (found.trang_thai === COMMISSION_STATUS.DA_THANH_TOAN) {
      throw new Error('Đơn đã thanh toán đối tác, không thể đối soát lại');
    }
    if (found.trang_thai !== COMMISSION_STATUS.CHO_DOI_SOAT) {
      throw new Error('Chỉ đối soát được đơn đang chờ đối soát');
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

  /** Đối soát hàng loạt các đơn chờ đối soát → đã đối soát (sang tab thanh toán ĐT) */
  confirmCommissionsBatch: async (ids, adminId) => {
    const list = Array.isArray(ids)
      ? [...new Set(ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n) && n > 0))]
      : [];
    if (!list.length) {
      throw new Error('Vui lòng chọn ít nhất một đơn để đối soát');
    }

    const rows = await prisma.hoa_hong.findMany({
      where: { ma_hoa_hong: { in: list } },
      select: { ma_hoa_hong: true, trang_thai: true },
    });
    if (!rows.length) throw new Error('Không tìm thấy hoa hồng');

    const eligible = rows.filter((r) => r.trang_thai === COMMISSION_STATUS.CHO_DOI_SOAT);
    if (!eligible.length) {
      throw new Error('Không có đơn nào đang chờ đối soát trong danh sách đã chọn');
    }

    const eligibleIds = eligible.map((r) => r.ma_hoa_hong);
    const adminVal = adminId ? Number(adminId) : null;

    await prisma.$transaction(async (tx) => {
      await tx.hoa_hong.updateMany({
        where: {
          ma_hoa_hong: { in: eligibleIds },
          trang_thai: COMMISSION_STATUS.CHO_DOI_SOAT,
        },
        data: { trang_thai: COMMISSION_STATUS.DA_DOI_SOAT },
      });

      for (const maHh of eligibleIds) {
        await tx.$executeRaw`
          UPDATE hoa_hong
          SET ngay_doi_soat = NOW(),
              doi_soat_boi_id = ${adminVal}
          WHERE ma_hoa_hong = ${maHh}
            AND trang_thai = ${COMMISSION_STATUS.DA_DOI_SOAT}
        `;
      }
    });

    const updated = await prisma.hoa_hong.findMany({
      where: { ma_hoa_hong: { in: eligibleIds } },
      include: COMMISSION_INCLUDE,
    });
    const mapped = [];
    for (const row of updated) {
      mapped.push(mapCommissionRow(await enrichCommissionAudit(row)));
    }

    const skipped = list.length - eligibleIds.length;
    return {
      so_luong: eligibleIds.length,
      bo_qua: skipped,
      items: mapped,
    };
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
      WHERE trang_thai IN ('da_thu', 'da_thanh_toan')
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
    const payoutRows = enriched.filter((r) => (
      r.trang_thai === COMMISSION_STATUS.DA_DOI_SOAT
      || r.trang_thai === 'da_thu'
      || r.trang_thai === 'da_thanh_toan'
      || r.trang_thai === COMMISSION_STATUS.DA_THANH_TOAN
    ));
    const partnerMeta = new Map();
    const pendingByPartner = new Map();
    const paidByBatch = new Map();

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
      ngay_doi_soat: null,
      phuong_thuc: null,
      ma_gd_doi_tac: null,
      ghi_chu: null,
      hotels: new Set(),
    });

    for (const r of payoutRows) {
      ensureMeta(r);
      const pid = r.ma_doi_tac;
      const breakdown = calculateCommissionBreakdown(
        r.dat_phong,
        Number(r.ty_le_hoa_hong) || DEFAULT_COMMISSION_RATE,
      );
      const doanhThu = breakdown.gmv_doi_tac;
      const hh = breakdown.so_tien_hoa_hong;
      const partnerAmt = breakdown.tien_doi_tac_nhan;
      const hotelName = r.dat_phong?.loai_phong?.khach_san?.ten;

      if (r.trang_thai === COMMISSION_STATUS.DA_DOI_SOAT || r.trang_thai === 'da_thu') {
        if (!pendingByPartner.has(pid)) pendingByPartner.set(pid, emptyBucket());
        const b = pendingByPartner.get(pid);
        b.so_don += 1;
        b.tong_doanh_thu += doanhThu;
        b.tong_hoa_hong += hh;
        b.so_tien += partnerAmt;
        if (hotelName) b.hotels.add(hotelName);
        if (r.ngay_doi_soat) {
          const ds = new Date(r.ngay_doi_soat);
          if (!b.ngay_doi_soat || ds > new Date(b.ngay_doi_soat)) b.ngay_doi_soat = ds;
        }
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
        if (hotelName) b.hotels.add(hotelName);
        if (r.ngay_doi_soat) {
          const ds = new Date(r.ngay_doi_soat);
          if (!b.ngay_doi_soat || ds > new Date(b.ngay_doi_soat)) b.ngay_doi_soat = ds;
        }
        if (r.ngay_thanh_toan_doi_tac) {
          const paidAt = new Date(r.ngay_thanh_toan_doi_tac);
          if (!b.ngay_thanh_toan || paidAt > new Date(b.ngay_thanh_toan)) {
            b.ngay_thanh_toan = paidAt;
          }
        }
        if (r.phuong_thuc_tt_doi_tac) b.phuong_thuc = r.phuong_thuc_tt_doi_tac;
        if (r.ma_gd_doi_tac) b.ma_gd_doi_tac = r.ma_gd_doi_tac;
        if (r.ghi_chu) b.ghi_chu = r.ghi_chu;
      }
    }
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
        danh_sach_khach_san: [...b.hotels],
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
        ngay_doi_soat: b.ngay_doi_soat,
        phuong_thuc_tt: null,
        ghi_chu: null,
        minh_chung: {
          phuong_thuc: null,
          ma_giao_dich: null,
          ghi_chu: null,
        },
        trang_thai: 'cho_thanh_toan',
      });
    }

    for (const b of paidByBatch.values()) {
      const meta = partnerMeta.get(b.ma_doi_tac);
      const proof = parsePayoutProofNote(b.ghi_chu);
      list.push({
        ma_dot: b.batch_key,
        ma_gd_doi_tac: b.ma_gd_doi_tac || null,
        ten_dot: b.ten_dot || 'Đợt đã thanh toán',
        so_dot: b.so_dot || null,
        ma_doi_tac: b.ma_doi_tac,
        ten_cong_ty: meta?.ten_cong_ty || `Đối tác #${b.ma_doi_tac}`,
        so_khach_san: meta?.hotels.size || 0,
        danh_sach_khach_san: [...b.hotels],
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
        ngay_doi_soat: b.ngay_doi_soat,
        phuong_thuc_tt: b.phuong_thuc,
        ghi_chu: b.ghi_chu,
        minh_chung: {
          phuong_thuc: b.phuong_thuc || null,
          ma_giao_dich: proof.ma_gd_ngan_hang || null,
          ghi_chu: proof.noi_dung_chuyen_khoan || b.ghi_chu || null,
          ky_thanh_toan: proof.ky_thanh_toan || null,
        },
        trang_thai: 'da_thanh_toan',
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

    const partnerIds = [...new Set(list.map((x) => x.ma_doi_tac))];
    if (partnerIds.length) {
      const bankRows = await prisma.doi_tac.findMany({
        where: { ma_doi_tac: { in: partnerIds } },
          select: {
          ma_doi_tac: true,
          so_tai_khoan: true,
          ten_chu_tai_khoan: true,
          ma_ngan_hang: true,
        },
      });
      const bankMap = new Map(bankRows.map((p) => [p.ma_doi_tac, hasCompleteBankAccount(p)]));
      list.forEach((row) => {
        row.tai_khoan_da_cap_nhat = Boolean(bankMap.get(row.ma_doi_tac));
      });
    }

    return list;
  },

  getPartnerPayoutStats: async (filters = {}) => {
    const list = await adminPaymentService.getPartnerPayouts({
      ...filters,
      trang_thai: 'all',
    });

    const tongCho = list
      .filter((x) => x.trang_thai === 'cho_thanh_toan')
      .reduce((s, x) => s + (Number(x.so_tien_can_thanh_toan) || 0), 0);

    const tongDaThanhToan = list
      .filter((x) => x.trang_thai === 'da_thanh_toan')
      .reduce((s, x) => s + (Number(x.so_tien_thanh_toan) || 0), 0);

    const tongHoaHongSan = list.reduce((s, x) => s + (Number(x.tong_hoa_hong) || 0), 0);

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
      tong_hoa_hong_san: tongHoaHongSan,
      tong_da_thanh_toan: tongDaThanhToan,
      so_doi_tac_cho: new Set(
        list.filter((x) => x.trang_thai === 'cho_thanh_toan').map((x) => x.ma_doi_tac),
      ).size,
      so_dot_da_thanh_toan: list.filter((x) => x.trang_thai === 'da_thanh_toan').length,
      so_ky_tam_giu: list.filter((x) => x.trang_thai === 'tam_giu').length,
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
    const partner = await prisma.doi_tac.findUnique({
      where: { ma_doi_tac: partnerId },
      select: {
        ma_doi_tac: true,
        ten_cong_ty: true,
        so_tai_khoan: true,
        ten_chu_tai_khoan: true,
        ma_ngan_hang: true,
        ten_ngan_hang: true,
        logo_ngan_hang: true,
      },
    });

    const idRows = await prisma.$queryRaw`
      SELECT ma_hoa_hong FROM hoa_hong
      WHERE ma_doi_tac = ${partnerId}
        AND trang_thai IN ('da_thu', 'da_thanh_toan')
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
    const commissions = enriched.map(mapCommissionRow);

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
    const hotels = new Set();

    const bookings = commissions.map((c) => {
      const tongTien = Number(c.doanh_thu_don) || Number(c.dat_phong?.thanh_toan_cuoi) || 0;
      const tienHh = Number(c.so_tien_hoa_hong) || 0;
      const partnerAmount = Number(c.tien_doi_tac_nhan) || Math.max(0, tongTien - tienHh);
      tienDoiTacNhan += partnerAmount;
      tongDoanhThu += tongTien;
      tongHoaHong += tienHh;

      const hotelName = c.dat_phong?.loai_phong?.khach_san?.ten;
      if (hotelName) hotels.add(hotelName);

      let tenDot = null;
      let soDot = null;
      let maDot = null;
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
        maDot = maGd;
        const meta = maGd ? maGdToDot.get(maGd) : null;
        tenDot = meta?.ten_dot || null;
        soDot = meta?.so_dot ?? null;
      } else {
        conChoNhan += partnerAmount;
        soDonChoTt += 1;
        tenDot = 'Đợt chờ thanh toán';
        maDot = `pending-${partnerId}`;
      }

      const proof = parsePayoutProofNote(c.ghi_chu);
      return {
        ma_hoa_hong: c.ma_hoa_hong,
        ma_dat_phong: c.dat_phong?.ma_dat_phong || null,
        ma_don_hang: c.dat_phong?.ma_don_hang || '—',
        khach_hang: c.dat_phong?.khach_hang?.ho_ten
          || c.dat_phong?.ten_nguoi_nhan
          || '—',
        khach_san: hotelName || '—',
        loai_phong: c.dat_phong?.loai_phong?.ten_loai || '—',
        ngay_nhan_phong: c.dat_phong?.ngay_nhan_phong || null,
        ngay_tra_phong: c.dat_phong?.ngay_tra_phong || null,
        ngay_hoan_thanh: c.dat_phong?.ngay_tra_phong || c.ngay_hoan_thanh || null,
        tong_tien: tongTien,
        ty_le_hoa_hong: Number(c.ty_le_hoa_hong) || 0,
        tien_hoa_hong: tienHh,
        tien_doi_tac_nhan: partnerAmount,
        trang_thai: c.trang_thai,
        ma_gd_doi_tac: c.ma_gd_doi_tac || null,
        ngay_doi_soat: c.ngay_doi_soat || null,
        ngay_thanh_toan_doi_tac: c.ngay_thanh_toan_doi_tac || null,
        phuong_thuc_tt_doi_tac: c.phuong_thuc_tt_doi_tac || null,
        ghi_chu: c.ghi_chu || null,
        minh_chung: {
          phuong_thuc: c.phuong_thuc_tt_doi_tac || null,
          ma_giao_dich: proof.ma_gd_ngan_hang || null,
          ghi_chu: proof.noi_dung_chuyen_khoan || null,
        },
        ten_dot: tenDot,
        so_dot: soDot,
        ma_dot: maDot,
      };
    });

    const trangThai = soDonChoTt > 0 ? 'cho_thanh_toan' : 'da_thanh_toan';
    const first = batches[0];
    return {
      ma_doi_tac: partnerId,
      ten_cong_ty: partner?.ten_cong_ty || first.ten_cong_ty,
      tai_khoan_ngan_hang: mapBankAccount(partner),
      so_khach_san: hotels.size || first.so_khach_san || 0,
      danh_sach_khach_san: [...hotels],
      so_don_da_doi_soat: bookings.length,
      so_don_cho_tt: soDonChoTt,
      so_don_da_tt: soDonDaTt,
      so_don_tam_giu: 0,
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

    const partner = await prisma.doi_tac.findUnique({
      where: { ma_doi_tac: partnerId },
      select: {
        so_tai_khoan: true,
        ten_chu_tai_khoan: true,
        ma_ngan_hang: true,
        ten_ngan_hang: true,
      },
    });
    if (!hasCompleteBankAccount(partner)) {
      throw new Error('Đối tác chưa cập nhật tài khoản nhận tiền. Không thể xác nhận thanh toán.');
    }

    const maGdNganHang = String(payload.ma_gd_ngan_hang || '').trim();
    const noiDungCk = String(payload.noi_dung_chuyen_khoan || '').trim();
    const kyThanhToan = String(payload.ky_thanh_toan || '').trim();

    if (!maGdNganHang) {
      throw new Error('Vui lòng nhập mã giao dịch ngân hàng');
    }
    if (!noiDungCk) {
      throw new Error('Vui lòng nhập nội dung chuyển khoản');
    }
    if (kyThanhToan !== 'tuan' && kyThanhToan !== 'thang') {
      throw new Error('Vui lòng chọn kỳ thanh toán theo tuần hoặc tháng');
    }

    const pendingRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS cnt FROM hoa_hong
      WHERE ma_doi_tac = ${partnerId} AND trang_thai = 'da_thu'
    `;
    const pending = Number(pendingRows?.[0]?.cnt || 0);

    if (!pending) {
      throw new Error('Không có đơn chờ thanh toán cho đối tác này. Hãy đối soát hoa hồng trước.');
    }

    const methodMap = {
      chuyen_khoan: 'Chuyển khoản ngân hàng',
      tien_mat: 'Tiền mặt',
      khac: 'Khác',
    };
    const methodKey = payload.phuong_thuc || 'chuyen_khoan';
    const phuongThuc = methodMap[methodKey] || String(payload.phuong_thuc || 'Chuyển khoản ngân hàng');

    const maDotPayload = String(payload.ma_dot || '').trim();
    const maGd = /^TT-\d+-\d+$/.test(maDotPayload)
      ? maDotPayload
      : `TT-${partnerId}-${Date.now()}`;

    const kyLabel = kyThanhToan === 'tuan' ? 'Theo tuần' : 'Theo tháng';
    const ghiChu = [
      `Mã đợt: ${maGd}`,
      `Mã GD ngân hàng: ${maGdNganHang}`,
      `Kỳ thanh toán: ${kyLabel}`,
      `Nội dung CK: ${noiDungCk}`,
    ].join(' | ');

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
