const prisma = require('../../config/prisma');

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

const getPartnerActiveStatus = async (doiTacId) => {
  const dt = await prisma.doi_tac.findUnique({
    where: { ma_doi_tac: doiTacId },
    select: {
      trang_thai: true,
      nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: { select: { trang_thai: true } },
    },
  });
  if (!dt) return false;
  if (dt.trang_thai !== 'hoat_dong') return false;
  const userStatus = dt.nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung?.trang_thai;
  return userStatus === 'hoat_dong';
};

const buildRespondEligibility = (dg, doiTacId, partnerActive) => {
  if (!partnerActive) {
    return {
      co_the_phan_hoi: false,
      ly_do_khong_phan_hoi: 'Tài khoản đối tác không đang hoạt động',
    };
  }

  const loaiPhong = dg.dat_phong?.loai_phong;
  const khachSan = loaiPhong?.khach_san;
  if (!loaiPhong || !khachSan || khachSan.ma_doi_tac !== doiTacId) {
    return {
      co_the_phan_hoi: false,
      ly_do_khong_phan_hoi: 'Khách sạn hoặc loại phòng không còn thuộc quyền quản lý của bạn',
    };
  }

  if (dg.trang_thai !== 'hien_thi') {
    return {
      co_the_phan_hoi: false,
      ly_do_khong_phan_hoi: 'Đánh giá của khách hàng không còn hiển thị',
    };
  }

  if (dg.phan_hoi_bi_an) {
    return {
      co_the_phan_hoi: false,
      ly_do_khong_phan_hoi: 'Phản hồi của bạn đã bị quản trị viên ẩn',
    };
  }

  return { co_the_phan_hoi: true, ly_do_khong_phan_hoi: null };
};

const mapReview = (dg, doiTacId, partnerActive) => ({
  ma_danh_gia: dg.ma_danh_gia,
  so_sao: dg.so_sao,
  diem_sach_se: dg.diem_sach_se,
  diem_dich_vu: dg.diem_dich_vu,
  diem_vi_tri: dg.diem_vi_tri,
  diem_tien_nghi: dg.diem_tien_nghi,
  noi_dung: dg.noi_dung,
  phan_hoi_doi_tac: dg.phan_hoi_doi_tac,
  phan_hoi_bi_an: !!dg.phan_hoi_bi_an,
  ly_do_an: dg.ly_do_an,
  ly_do_an_phan_hoi: dg.ly_do_an_phan_hoi,
  ngay_danh_gia: dg.ngay_danh_gia,
  ngay_phan_hoi: dg.ngay_phan_hoi,
  trang_thai: dg.trang_thai,
  da_phan_hoi: !!dg.phan_hoi_doi_tac,
  khach_hang: dg.khach_hang ? { ho_ten: dg.khach_hang.ho_ten } : null,
  ma_don_hang: dg.dat_phong?.ma_don_hang,
  ma_dat_phong: dg.dat_phong?.ma_dat_phong,
  ngay_nhan_phong: dg.dat_phong?.ngay_nhan_phong,
  ngay_tra_phong: dg.dat_phong?.ngay_tra_phong,
  ma_loai_phong: dg.dat_phong?.loai_phong?.ma_loai_phong,
  ten_loai: dg.dat_phong?.loai_phong?.ten_loai,
  ma_khach_san: dg.dat_phong?.loai_phong?.khach_san?.ma_khach_san,
  ten_khach_san: dg.dat_phong?.loai_phong?.khach_san?.ten,
  ...buildRespondEligibility(dg, doiTacId, partnerActive),
});

const reviewInclude = {
  khach_hang: { select: { ho_ten: true } },
  dat_phong: {
    select: {
      ma_dat_phong: true,
      ma_don_hang: true,
      ngay_nhan_phong: true,
      ngay_tra_phong: true,
      loai_phong: {
        select: {
          ma_loai_phong: true,
          ten_loai: true,
          khach_san: { select: { ma_khach_san: true, ten: true, ma_doi_tac: true } },
        },
      },
    },
  },
};

const partnerReviewService = {
  getHotels: async (doiTacId) => {
    return prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTacId },
      select: { ma_khach_san: true, ten: true },
      orderBy: { ten: 'asc' },
    });
  },

  getRoomTypes: async (doiTacId, maKhachSan) => {
    const where = { khach_san: { ma_doi_tac: doiTacId } };
    if (maKhachSan) where.ma_khach_san = Number(maKhachSan);
    return prisma.loai_phong.findMany({
      where,
      select: { ma_loai_phong: true, ten_loai: true, ma_khach_san: true },
      orderBy: { ten_loai: 'asc' },
    });
  },

  getReviews: async (doiTacId, query = {}) => {
    const {
      ma_khach_san, ma_loai_phong, so_sao,
      phan_hoi, tu_ngay, den_ngay,
    } = query;

    const bookingWhere = {
      loai_phong: {
        khach_san: { ma_doi_tac: doiTacId },
      },
    };
    if (ma_khach_san) {
      bookingWhere.loai_phong.ma_khach_san = Number(ma_khach_san);
    }
    if (ma_loai_phong) {
      bookingWhere.ma_loai_phong = Number(ma_loai_phong);
    }

    const where = {
      trang_thai: { in: ['hien_thi', 'an'] },
      dat_phong: bookingWhere,
    };

    if (so_sao) where.so_sao = Number(so_sao);
    if (phan_hoi === 'chua_phan_hoi') where.phan_hoi_doi_tac = null;
    if (phan_hoi === 'da_phan_hoi') where.phan_hoi_doi_tac = { not: null };

    const ngayFilter = buildDateFilter(tu_ngay, den_ngay);
    if (ngayFilter) where.ngay_danh_gia = ngayFilter;

    const reviews = await prisma.danh_gia.findMany({
      where,
      include: reviewInclude,
      orderBy: { ngay_danh_gia: 'desc' },
    });

    const partnerActive = await getPartnerActiveStatus(doiTacId);
    const mapped = reviews.map((dg) => mapReview(dg, doiTacId, partnerActive));

    const tong = mapped.length;
    const chuaPhanHoi = mapped.filter((r) => !r.da_phan_hoi).length;
    const daPhanHoi = tong - chuaPhanHoi;
    const diemTB = tong > 0
      ? Math.round((mapped.reduce((s, r) => s + r.so_sao, 0) / tong) * 10) / 10
      : 0;

    const phanBoSao = [5, 4, 3, 2, 1].map((star) => ({
      so_sao: star,
      so_luong: mapped.filter((r) => r.so_sao === star).length,
    }));

    const roomMap = {};
    mapped.forEach((r) => {
      const key = r.ma_loai_phong;
      if (!key) return;
      if (!roomMap[key]) {
        roomMap[key] = {
          ma_loai_phong: r.ma_loai_phong,
          ten_loai: r.ten_loai,
          ten_khach_san: r.ten_khach_san,
          tong_sao: 0,
          so_danh_gia: 0,
        };
      }
      roomMap[key].tong_sao += r.so_sao;
      roomMap[key].so_danh_gia += 1;
    });

    const theoLoaiPhong = Object.values(roomMap)
      .map((r) => ({
        ma_loai_phong: r.ma_loai_phong,
        ten_loai: r.ten_loai,
        ten_khach_san: r.ten_khach_san,
        diem_trung_binh: r.so_danh_gia > 0
          ? Math.round((r.tong_sao / r.so_danh_gia) * 10) / 10
          : 0,
        so_danh_gia: r.so_danh_gia,
      }))
      .sort((a, b) => b.so_danh_gia - a.so_danh_gia);

    return {
      stats: {
        diem_trung_binh: diemTB,
        tong_danh_gia: tong,
        da_phan_hoi: daPhanHoi,
        chua_phan_hoi: chuaPhanHoi,
        phan_bo_sao: phanBoSao,
      },
      theo_loai_phong: theoLoaiPhong,
      danh_sach: mapped,
    };
  },

  getReviewById: async (maDanhGia, doiTacId) => {
    const review = await prisma.danh_gia.findFirst({
      where: {
        ma_danh_gia: Number(maDanhGia),
        trang_thai: { in: ['hien_thi', 'an'] },
        dat_phong: {
          loai_phong: { khach_san: { ma_doi_tac: doiTacId } },
        },
      },
      include: reviewInclude,
    });

    if (!review) throw new Error('Không tìm thấy đánh giá');
    const partnerActive = await getPartnerActiveStatus(doiTacId);
    return mapReview(review, doiTacId, partnerActive);
  },

  respond: async (maDanhGia, phan_hoi_doi_tac, doiTacId) => {
    const partnerActive = await getPartnerActiveStatus(doiTacId);
    const review = await prisma.danh_gia.findFirst({
      where: {
        ma_danh_gia: Number(maDanhGia),
        trang_thai: { in: ['hien_thi', 'an'] },
        dat_phong: {
          loai_phong: { khach_san: { ma_doi_tac: doiTacId } },
        },
      },
      include: reviewInclude,
    });

    if (!review) {
      throw new Error('Không tìm thấy đánh giá hoặc không thuộc quyền quản lý của bạn');
    }

    const eligibility = buildRespondEligibility(review, doiTacId, partnerActive);
    if (!eligibility.co_the_phan_hoi) {
      throw new Error(eligibility.ly_do_khong_phan_hoi);
    }

    const updated = await prisma.danh_gia.update({
      where: { ma_danh_gia: Number(maDanhGia) },
      data: {
        phan_hoi_doi_tac: phan_hoi_doi_tac.trim(),
        ngay_phan_hoi: new Date(),
      },
      include: reviewInclude,
    });

    return mapReview(updated, doiTacId, partnerActive);
  },
};

module.exports = partnerReviewService;
