const prisma = require('../../../config/prisma');

const reportInclude = {
  khach_hang: { select: { ho_ten: true, ma_khach_hang: true } },
  khach_san: { select: { ten: true, ma_khach_san: true } },
  dat_phong: {
    select: {
      ma_don_hang: true,
      loai_phong: { select: { ten_loai: true } },
    },
  },
  nguoi_dung: { select: { email: true } },
};

const mapReport = (bc) => ({
  ma_bao_cao: bc.ma_bao_cao,
  loai_bao_cao: bc.loai_bao_cao,
  tieu_de: bc.tieu_de,
  noi_dung: bc.noi_dung,
  minh_chung: bc.minh_chung,
  trang_thai: bc.trang_thai,
  phan_hoi_admin: bc.phan_hoi_admin,
  ngay_bao_cao: bc.ngay_bao_cao,
  ngay_xu_ly: bc.ngay_xu_ly,
  khach_hang: bc.khach_hang,
  ten_khach_san: bc.khach_san?.ten,
  ma_khach_san: bc.khach_san?.ma_khach_san,
  ma_don_hang: bc.dat_phong?.ma_don_hang,
  ten_loai_phong: bc.dat_phong?.loai_phong?.ten_loai,
  admin_xu_ly: bc.nguoi_dung?.email,
});

const buildWhere = (filters = {}) => {
  const { trang_thai, loai_bao_cao, tu_ngay, den_ngay } = filters;
  const where = {};

  if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
  if (loai_bao_cao && loai_bao_cao !== 'all') where.loai_bao_cao = loai_bao_cao;

  if (tu_ngay || den_ngay) {
    where.ngay_bao_cao = {};
    if (tu_ngay) where.ngay_bao_cao.gte = new Date(tu_ngay);
    if (den_ngay) {
      const end = new Date(den_ngay);
      end.setHours(23, 59, 59, 999);
      where.ngay_bao_cao.lte = end;
    }
  }

  return where;
};

const getDashboard = async () => {
  const [total, choXuLy, daChapNhan, tuChoi, byType, recent] = await Promise.all([
    prisma.bao_cao.count(),
    prisma.bao_cao.count({ where: { trang_thai: 'cho_xu_ly' } }),
    prisma.bao_cao.count({ where: { trang_thai: 'da_chap_nhan' } }),
    prisma.bao_cao.count({ where: { trang_thai: 'tu_choi' } }),
    prisma.bao_cao.groupBy({
      by: ['loai_bao_cao'],
      _count: true,
    }),
    prisma.bao_cao.findMany({
      take: 6,
      orderBy: { ngay_bao_cao: 'desc' },
      include: reportInclude,
    }),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const moiTrongThang = await prisma.bao_cao.count({
    where: { ngay_bao_cao: { gte: thirtyDaysAgo } },
  });

  return {
    tong_bao_cao: total,
    cho_xu_ly: choXuLy,
    da_chap_nhan: daChapNhan,
    tu_choi: tuChoi,
    moi_30_ngay: moiTrongThang,
    theo_loai: byType.map((t) => ({
      loai_bao_cao: t.loai_bao_cao,
      so_luong: t._count,
    })),
    gan_day: recent.map(mapReport),
  };
};

const getReports = async (filters = {}) => {
  const where = buildWhere(filters);
  const reports = await prisma.bao_cao.findMany({
    where,
    include: reportInclude,
    orderBy: { ngay_bao_cao: 'desc' },
  });
  return reports.map(mapReport);
};

const getReportById = async (id) => {
  const report = await prisma.bao_cao.findUnique({
    where: { ma_bao_cao: Number(id) },
    include: reportInclude,
  });
  return report ? mapReport(report) : null;
};

const acceptReport = async (id, adminId, phan_hoi_admin) => {
  const report = await prisma.bao_cao.findUnique({
    where: { ma_bao_cao: Number(id) },
  });
  if (!report) return null;
  if (report.trang_thai !== 'cho_xu_ly') {
    throw new Error('Báo cáo đã được xử lý');
  }

  return prisma.bao_cao.update({
    where: { ma_bao_cao: Number(id) },
    data: {
      trang_thai: 'da_chap_nhan',
      admin_xu_ly_id: adminId ? Number(adminId) : null,
      phan_hoi_admin: phan_hoi_admin?.trim() || null,
      ngay_xu_ly: new Date(),
    },
    include: reportInclude,
  }).then(mapReport);
};

const rejectReport = async (id, adminId, phan_hoi_admin) => {
  const report = await prisma.bao_cao.findUnique({
    where: { ma_bao_cao: Number(id) },
  });
  if (!report) return null;
  if (report.trang_thai !== 'cho_xu_ly') {
    throw new Error('Báo cáo đã được xử lý');
  }
  if (!phan_hoi_admin?.trim()) {
    throw new Error('Vui lòng nhập lý do từ chối');
  }

  return prisma.bao_cao.update({
    where: { ma_bao_cao: Number(id) },
    data: {
      trang_thai: 'tu_choi',
      admin_xu_ly_id: adminId ? Number(adminId) : null,
      phan_hoi_admin: phan_hoi_admin.trim(),
      ngay_xu_ly: new Date(),
    },
    include: reportInclude,
  }).then(mapReport);
};

module.exports = {
  getDashboard,
  getReports,
  getReportById,
  acceptReport,
  rejectReport,
};
