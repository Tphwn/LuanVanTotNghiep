const prisma = require('../../../config/prisma');
const { notifyCustomer } = require('../../../utils/customerNotify');
const {
  notifyReviewHidden,
  notifyReviewUnhidden,
  notifyPartnerResponseHidden,
  notifyPartnerResponseUnhidden,
} = require('../../../utils/partnerNotify');

const reviewInclude = {
  khach_hang: { select: { ho_ten: true, ma_khach_hang: true } },
  nguoi_dung: { select: { email: true, ma_nguoi_dung: true } },
  dat_phong: {
    select: {
      ma_don_hang: true,
      ngay_nhan_phong: true,
      ngay_tra_phong: true,
      loai_phong: {
        select: {
          ma_loai_phong: true,
          ten_loai: true,
          khach_san: {
            select: {
              ma_khach_san: true,
              ten: true,
              doi_tac: { select: { ten_cong_ty: true } },
            },
          },
        },
      },
    },
  },
};

const buildDateFilter = (tu_ngay, den_ngay) => {
  if (!tu_ngay && !den_ngay) return undefined;
  const filter = {};
  if (tu_ngay) filter.gte = new Date(tu_ngay);
  if (den_ngay) {
    const end = new Date(den_ngay);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return filter;
};

const mapReview = (dg) => ({
  ma_danh_gia: dg.ma_danh_gia,
  so_sao: dg.so_sao,
  diem_sach_se: dg.diem_sach_se,
  diem_dich_vu: dg.diem_dich_vu,
  diem_vi_tri: dg.diem_vi_tri,
  noi_dung: dg.noi_dung,
  phan_hoi_doi_tac: dg.phan_hoi_doi_tac,
  phan_hoi_bi_an: !!dg.phan_hoi_bi_an,
  ly_do_an: dg.ly_do_an,
  ly_do_an_phan_hoi: dg.ly_do_an_phan_hoi,
  ngay_danh_gia: dg.ngay_danh_gia,
  ngay_phan_hoi: dg.ngay_phan_hoi,
  ngay_duyet: dg.ngay_duyet,
  trang_thai: dg.trang_thai,
  da_phan_hoi: !!dg.phan_hoi_doi_tac,
  khach_hang: dg.khach_hang ? { ho_ten: dg.khach_hang.ho_ten, ma_khach_hang: dg.khach_hang.ma_khach_hang } : null,
  admin_duyet: dg.nguoi_dung ? { email: dg.nguoi_dung.email } : null,
  ma_don_hang: dg.dat_phong?.ma_don_hang,
  ma_dat_phong: dg.ma_dat_phong,
  ngay_nhan_phong: dg.dat_phong?.ngay_nhan_phong,
  ngay_tra_phong: dg.dat_phong?.ngay_tra_phong,
  ma_loai_phong: dg.dat_phong?.loai_phong?.ma_loai_phong,
  ten_loai: dg.dat_phong?.loai_phong?.ten_loai,
  ma_khach_san: dg.dat_phong?.loai_phong?.khach_san?.ma_khach_san,
  ten_khach_san: dg.dat_phong?.loai_phong?.khach_san?.ten,
  ten_doi_tac: dg.dat_phong?.loai_phong?.khach_san?.doi_tac?.ten_cong_ty,
});

const buildStats = (mapped) => {
  const tong = mapped.length;
  const diemTB = tong > 0
    ? Math.round((mapped.reduce((s, r) => s + r.so_sao, 0) / tong) * 10) / 10
    : 0;

  const phanBoSao = [5, 4, 3, 2, 1].map((star) => ({
    so_sao: star,
    so_luong: mapped.filter((r) => r.so_sao === star).length,
  }));

  const hotelMap = {};
  mapped.forEach((r) => {
    const key = r.ma_khach_san;
    if (!key) return;
    if (!hotelMap[key]) {
      hotelMap[key] = {
        ma_khach_san: r.ma_khach_san,
        ten_khach_san: r.ten_khach_san,
        tong_sao: 0,
        so_danh_gia: 0,
      };
    }
    hotelMap[key].tong_sao += r.so_sao;
    hotelMap[key].so_danh_gia += 1;
  });

  const theo_khach_san = Object.values(hotelMap)
    .map((h) => ({
      ma_khach_san: h.ma_khach_san,
      ten_khach_san: h.ten_khach_san,
      diem_trung_binh: h.so_danh_gia > 0
        ? Math.round((h.tong_sao / h.so_danh_gia) * 10) / 10
        : 0,
      so_danh_gia: h.so_danh_gia,
    }))
    .sort((a, b) => b.so_danh_gia - a.so_danh_gia);

  return {
    diem_trung_binh: diemTB,
    tong_danh_gia: tong,
    hien_thi: mapped.filter((r) => r.trang_thai === 'hien_thi').length,
    an: mapped.filter((r) => r.trang_thai === 'an').length,
    bi_bao_cao: 0,
    chua_phan_hoi: mapped.filter((r) => !r.da_phan_hoi).length,
    phan_bo_sao: phanBoSao,
    theo_khach_san,
  };
};

const getReviews = async (query = {}) => {
  const { ma_khach_san, ma_doi_tac, so_sao, trang_thai, tu_ngay, den_ngay } = query;

  const where = {};

  if (trang_thai && trang_thai !== 'all') {
    where.trang_thai = trang_thai;
  }

  if (so_sao) where.so_sao = Number(so_sao);

  const ngayFilter = buildDateFilter(tu_ngay, den_ngay);
  if (ngayFilter) where.ngay_danh_gia = ngayFilter;

  if (ma_khach_san) {
    where.dat_phong = {
      loai_phong: { ma_khach_san: Number(ma_khach_san) },
    };
  } else if (ma_doi_tac) {
    where.dat_phong = {
      loai_phong: {
        khach_san: { ma_doi_tac: Number(ma_doi_tac) },
      },
    };
  }

  const reviews = await prisma.danh_gia.findMany({
    where,
    include: reviewInclude,
    orderBy: { ngay_danh_gia: 'desc' },
  });

  const mapped = reviews.map(mapReview);

  const bookingIds = [...new Set(mapped.map((r) => r.ma_dat_phong).filter(Boolean))];
  const biBaoCao = bookingIds.length > 0
    ? await prisma.bao_cao.count({ where: { ma_dat_phong: { in: bookingIds } } })
    : 0;

  const stats = buildStats(mapped);
  stats.bi_bao_cao = biBaoCao;

  return {
    stats,
    danh_sach: mapped,
  };
};

const getReviewById = async (id) => {
  const review = await prisma.danh_gia.findUnique({
    where: { ma_danh_gia: Number(id) },
    include: reviewInclude,
  });
  if (!review) return null;
  return mapReview(review);
};

const APPROVED_HOTEL_STATUSES = ['hoat_dong', 'da_duyet', 'bi_khoa'];

const getFilterHotels = async () => {
  return prisma.khach_san.findMany({
    where: { trang_thai: { in: APPROVED_HOTEL_STATUSES } },
    select: { ma_khach_san: true, ten: true, ma_doi_tac: true },
    orderBy: { ten: 'asc' },
  });
};

const getFilterPartners = async () => {
  const rows = await prisma.khach_san.groupBy({
    by: ['ma_doi_tac'],
    where: { trang_thai: { in: APPROVED_HOTEL_STATUSES } },
  });
  const ids = rows.map((r) => r.ma_doi_tac);
  if (!ids.length) return [];

  return prisma.doi_tac.findMany({
    where: { ma_doi_tac: { in: ids } },
    select: { ma_doi_tac: true, ten_cong_ty: true },
    orderBy: { ten_cong_ty: 'asc' },
  });
};

const getReviewContext = async (id) => prisma.danh_gia.findUnique({
  where: { ma_danh_gia: Number(id) },
  include: {
    khach_hang: {
      select: {
        ho_ten: true,
        ma_khach_hang: true,
        nguoi_dung: { select: { ma_nguoi_dung: true } },
      },
    },
    dat_phong: {
      select: {
        ma_dat_phong: true,
        ma_don_hang: true,
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: {
              select: {
                ten: true,
                ma_doi_tac: true,
                doi_tac: { select: { ten_cong_ty: true } },
              },
            },
          },
        },
      },
    },
  },
});

const getNotifyPayload = (context) => ({
  maDonHang: context.dat_phong?.ma_don_hang || '—',
  tenKhachSan: context.dat_phong?.loai_phong?.khach_san?.ten || '—',
  maDoiTac: context.dat_phong?.loai_phong?.khach_san?.ma_doi_tac,
  maNguoiDung: context.khach_hang?.nguoi_dung?.ma_nguoi_dung,
  maDatPhong: context.dat_phong?.ma_dat_phong,
});

const hideReview = async (id, lyDo) => {
  const context = await getReviewContext(id);
  if (!context) return null;
  if (context.trang_thai === 'an') {
    return prisma.danh_gia.findUnique({
      where: { ma_danh_gia: Number(id) },
      include: reviewInclude,
    }).then(mapReview);
  }

  const updated = await prisma.danh_gia.update({
    where: { ma_danh_gia: Number(id) },
    data: {
      trang_thai: 'an',
      ly_do_an: lyDo,
    },
    include: reviewInclude,
  });

  const payload = getNotifyPayload(context);
  if (payload.maNguoiDung) {
    await notifyCustomer(payload.maNguoiDung, {
      tieu_de: 'Đánh giá của bạn đã bị ẩn',
      noi_dung: `Đánh giá đơn #${payload.maDonHang} tại "${payload.tenKhachSan}" đã bị ẩn. Lý do: ${lyDo}`,
      loai: 'danh_gia',
      ma_dat_phong: payload.maDatPhong,
    });
  }
  if (payload.maDoiTac) {
    await notifyReviewHidden(payload.maDoiTac, {
      maDonHang: payload.maDonHang,
      tenKhachSan: payload.tenKhachSan,
      lyDo,
    });
  }

  return mapReview(updated);
};

const unhideReview = async (id) => {
  const context = await getReviewContext(id);
  if (!context) return null;

  const updated = await prisma.danh_gia.update({
    where: { ma_danh_gia: Number(id) },
    data: {
      trang_thai: 'hien_thi',
      ly_do_an: null,
    },
    include: reviewInclude,
  });

  const payload = getNotifyPayload(context);
  if (payload.maNguoiDung) {
    await notifyCustomer(payload.maNguoiDung, {
      tieu_de: 'Đánh giá của bạn đã được hiện lại',
      noi_dung: `Đánh giá đơn #${payload.maDonHang} tại "${payload.tenKhachSan}" đã được hiện lại trên hệ thống.`,
      loai: 'danh_gia',
      ma_dat_phong: payload.maDatPhong,
    });
  }
  if (payload.maDoiTac) {
    await notifyReviewUnhidden(payload.maDoiTac, {
      maDonHang: payload.maDonHang,
      tenKhachSan: payload.tenKhachSan,
    });
  }

  return mapReview(updated);
};

const hidePartnerResponse = async (id, lyDo) => {
  const context = await getReviewContext(id);
  if (!context) return null;
  if (!context.phan_hoi_doi_tac?.trim()) {
    throw { statusCode: 400, message: 'Đánh giá chưa có phản hồi đối tác' };
  }
  if (context.phan_hoi_bi_an) {
    return prisma.danh_gia.findUnique({
      where: { ma_danh_gia: Number(id) },
      include: reviewInclude,
    }).then(mapReview);
  }

  const updated = await prisma.danh_gia.update({
    where: { ma_danh_gia: Number(id) },
    data: {
      phan_hoi_bi_an: true,
      ly_do_an_phan_hoi: lyDo,
    },
    include: reviewInclude,
  });

  const payload = getNotifyPayload(context);
  if (payload.maDoiTac) {
    await notifyPartnerResponseHidden(payload.maDoiTac, {
      maDonHang: payload.maDonHang,
      tenKhachSan: payload.tenKhachSan,
      lyDo,
    });
  }

  return mapReview(updated);
};

const unhidePartnerResponse = async (id) => {
  const context = await getReviewContext(id);
  if (!context) return null;

  const updated = await prisma.danh_gia.update({
    where: { ma_danh_gia: Number(id) },
    data: {
      phan_hoi_bi_an: false,
      ly_do_an_phan_hoi: null,
    },
    include: reviewInclude,
  });

  const payload = getNotifyPayload(context);
  if (payload.maDoiTac) {
    await notifyPartnerResponseUnhidden(payload.maDoiTac, {
      maDonHang: payload.maDonHang,
      tenKhachSan: payload.tenKhachSan,
    });
  }

  return mapReview(updated);
};

module.exports = {
  getReviews,
  getReviewById,
  getFilterHotels,
  getFilterPartners,
  hideReview,
  unhideReview,
  hidePartnerResponse,
  unhidePartnerResponse,
};
