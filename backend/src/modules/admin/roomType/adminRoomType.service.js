const prisma = require('../../../config/prisma');
const { attachRoomImages } = require('../../../utils/images');
const {
  getRoomLockState,
  isLockedByPartner,
} = require('../../../utils/partnerLockHelpers');
const {
  notifyRoomTypeLocked,
  notifyRoomTypeUnlocked,
} = require('../../../utils/partnerNotify');
const {
  countActiveBookedRooms,
  countActiveBookedRoomsMap,
  calcRoomAvailability,
} = require('../../../utils/bookingHelpers');

const APPROVED_HOTEL_STATUSES = ['hoat_dong', 'da_duyet', 'bi_khoa'];

const buildApprovedHotelWhere = (filters = {}) => {
  const hotelWhere = { trang_thai: { in: APPROVED_HOTEL_STATUSES } };
  if (filters.ma_dia_diem) hotelWhere.ma_dia_diem = Number(filters.ma_dia_diem);
  if (filters.ma_doi_tac) hotelWhere.ma_doi_tac = Number(filters.ma_doi_tac);
  if (filters.ma_khach_san) hotelWhere.ma_khach_san = Number(filters.ma_khach_san);
  return hotelWhere;
};

const buildRoomWhere = (filters = {}) => {
  const { trang_thai, keyword, ma_khach_san } = filters;
  const where = { khach_san: buildApprovedHotelWhere(filters) };

  if (ma_khach_san) where.ma_khach_san = Number(ma_khach_san);

  if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;

  if (keyword?.trim()) {
    where.OR = [
      { ten_loai: { contains: keyword.trim() } },
      { khach_san: { ten: { contains: keyword.trim() } } },
      { khach_san: { doi_tac: { ten_cong_ty: { contains: keyword.trim() } } } },
    ];
  }

  return where;
};

const getLoaiGiuongLabel = (soGiuong, sucChua) => {
  const n = Number(soGiuong) || 1;
  const sc = Number(sucChua) || 1;
  if (n === 1) {
    if (sc >= 4) return '1 giường đôi lớn + sofa';
    if (sc >= 2) return '1 giường đôi';
    return '1 giường đơn';
  }
  return `${n} giường đơn`;
};

const computeInventory = (room, daDat = 0) => {
  const tong = Number(room.so_luong_phong);
  const moBan = Number(room.so_luong_mo_ban ?? 0);
  const hotelLocked = room.khach_san?.trang_thai === 'bi_khoa';

  if (hotelLocked) {
    return { tong_so_phong: tong, dang_mo_ban: 0, dang_bao_tri: 0, dang_khoa: tong, da_dat: 0, con_trong: 0 };
  }
  if (room.trang_thai === 'an') {
    return { tong_so_phong: tong, dang_mo_ban: 0, dang_bao_tri: 0, dang_khoa: tong, da_dat: 0, con_trong: 0 };
  }
  return {
    tong_so_phong: tong,
    dang_mo_ban: moBan,
    dang_bao_tri: Math.max(0, tong - moBan),
    dang_khoa: 0,
    da_dat: daDat,
    con_trong: Math.max(0, moBan - daDat),
  };
};

const getPriceSummary = async (maLoaiPhong, giaCoBan) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cuoiTuan, leTet] = await Promise.all([
    prisma.bang_gia_phong.findFirst({
      where: { ma_loai_phong: Number(maLoaiPhong), loai_gia: 'cuoi_tuan', ngay: { gte: today } },
      orderBy: { ngay: 'asc' },
    }),
    prisma.bang_gia_phong.findFirst({
      where: { ma_loai_phong: Number(maLoaiPhong), loai_gia: 'le_tet', ngay: { gte: today } },
      orderBy: { ngay: 'asc' },
    }),
  ]);

  const base = Number(giaCoBan);
  return {
    gia_co_ban: base,
    gia_cuoi_tuan: cuoiTuan ? Number(cuoiTuan.don_gia) : null,
    gia_le: leTet ? Number(leTet.don_gia) : null,
  };
};

const getRoomTypes = async (filters = {}) => {
  const rooms = await prisma.loai_phong.findMany({
    where: buildRoomWhere(filters),
    include: {
      khach_san: {
        select: {
          ma_khach_san: true,
          ten: true,
          trang_thai: true,
          dia_diem: { select: { ma_dia_diem: true, ten_dia_diem: true } },
          doi_tac: {
            select: {
              ma_doi_tac: true,
              ten_cong_ty: true,
              nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
                select: { trang_thai: true },
              },
            },
          },
        },
      },
    },
    orderBy: { ma_loai_phong: 'desc' },
  });

  // Trừ số phòng đang có đơn giữ để hiển thị "còn lại" chính xác
  const bookedMap = await countActiveBookedRoomsMap(rooms.map((r) => r.ma_loai_phong));
  const withAvailability = rooms.map((room) => {
    const daDat = bookedMap.get(room.ma_loai_phong) || 0;
    return { ...room, ...calcRoomAvailability(room, daDat) };
  });

  return attachRoomImages(withAvailability);
};

const getRoomTypeById = async (id) => {
  const room = await prisma.loai_phong.findUnique({
    where: { ma_loai_phong: Number(id) },
    include: {
      khach_san: {
        include: {
          dia_diem: true,
          doi_tac: { select: { ten_cong_ty: true, ma_doi_tac: true } },
        },
      },
      loai_phong_tien_nghi: { include: { tien_nghi: true } },
    },
  });

  if (!room) return null;
  if (!APPROVED_HOTEL_STATUSES.includes(room.khach_san?.trang_thai)) return null;

  const daDat = await countActiveBookedRooms(room.ma_loai_phong);

  const [hinh_anh, gia, reviews, reviewAgg] = await Promise.all([
    prisma.hinh_anh.findMany({
      where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: room.ma_loai_phong },
      orderBy: { thu_tu: 'asc' },
    }),
    getPriceSummary(room.ma_loai_phong, room.gia_co_ban),
    prisma.danh_gia.findMany({
      where: {
        trang_thai: 'hien_thi',
        dat_phong: { ma_loai_phong: room.ma_loai_phong },
      },
      include: {
        khach_hang: { select: { ho_ten: true } },
        dat_phong: { select: { ma_don_hang: true } },
      },
      orderBy: { ngay_danh_gia: 'desc' },
      take: 20,
    }),
    prisma.danh_gia.aggregate({
      where: {
        trang_thai: 'hien_thi',
        dat_phong: { ma_loai_phong: room.ma_loai_phong },
      },
      _avg: { so_sao: true, diem_sach_se: true, diem_dich_vu: true },
      _count: true,
    }),
  ]);

  return {
    ...room,
    hinh_anh,
    loai_giuong: getLoaiGiuongLabel(room.so_giuong, room.suc_chua),
    ...calcRoomAvailability(room, daDat),
    tinh_trang_phong: computeInventory(room, daDat),
    gia: gia,
    danh_gia: reviews.map((dg) => ({
      ma_danh_gia: dg.ma_danh_gia,
      so_sao: dg.so_sao,
      diem_sach_se: dg.diem_sach_se,
      diem_dich_vu: dg.diem_dich_vu,
      diem_vi_tri: dg.diem_vi_tri,
      noi_dung: dg.noi_dung,
      phan_hoi_doi_tac: dg.phan_hoi_doi_tac,
      ngay_danh_gia: dg.ngay_danh_gia,
      khach_hang: dg.khach_hang,
      ma_don_hang: dg.dat_phong?.ma_don_hang,
    })),
    thong_ke_danh_gia: {
      tong: reviewAgg._count,
      diem_trung_binh: reviewAgg._avg.so_sao
        ? Math.round(reviewAgg._avg.so_sao * 10) / 10
        : 0,
      diem_sach_se: reviewAgg._avg.diem_sach_se
        ? Math.round(reviewAgg._avg.diem_sach_se * 10) / 10
        : null,
      diem_dich_vu: reviewAgg._avg.diem_dich_vu
        ? Math.round(reviewAgg._avg.diem_dich_vu * 10) / 10
        : null,
    },
  };
};

const getFilterLocations = async () => {
  const rows = await prisma.khach_san.groupBy({
    by: ['ma_dia_diem'],
    where: { trang_thai: { in: APPROVED_HOTEL_STATUSES } },
  });
  const ids = rows.map((r) => r.ma_dia_diem);
  if (!ids.length) return [];

  return prisma.dia_diem.findMany({
    where: { ma_dia_diem: { in: ids } },
    select: { ma_dia_diem: true, ten_dia_diem: true },
    orderBy: { ten_dia_diem: 'asc' },
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

const getStats = async (filters = {}) => {
  const baseWhere = buildRoomWhere({ ...filters, trang_thai: 'all' });
  const [total, active, hidden] = await Promise.all([
    prisma.loai_phong.count({ where: baseWhere }),
    prisma.loai_phong.count({ where: { ...baseWhere, trang_thai: 'hoat_dong' } }),
    prisma.loai_phong.count({ where: { ...baseWhere, trang_thai: 'an' } }),
  ]);
  return { total, active, hidden };
};

const getRoomNotifyContext = async (id) => prisma.loai_phong.findUnique({
  where: { ma_loai_phong: Number(id) },
  include: {
    khach_san: {
      select: {
        ten: true,
        ma_doi_tac: true,
      },
    },
  },
});

const hideRoomType = async (id, lyDo) => {
  const room = await getRoomLockState(prisma, id);
  if (!room) return null;

  if (isLockedByPartner(room)) {
    throw {
      statusCode: 400,
      message: 'Loại phòng đang bị đối tác khóa. Bạn không thể thay đổi trạng thái.',
    };
  }
  if (room.trang_thai === 'an') {
    return prisma.loai_phong.findUnique({ where: { ma_loai_phong: Number(id) } });
  }

  const moBanTruoc = Number(room.so_luong_mo_ban) > 0
    ? room.so_luong_mo_ban
    : room.so_luong_phong;

  const updated = await prisma.loai_phong.update({
    where: { ma_loai_phong: Number(id) },
    data: {
      trang_thai: 'an',
      khoa_do_doi_tac: false,
      so_luong_mo_ban_truoc_khoa: moBanTruoc,
      so_luong_mo_ban: 0,
    },
  });

  const context = await getRoomNotifyContext(id);
  if (context?.khach_san?.ma_doi_tac) {
    await notifyRoomTypeLocked(context.khach_san.ma_doi_tac, {
      tenLoaiPhong: context.ten_loai,
      tenKhachSan: context.khach_san.ten,
      lyDo,
    });
  }

  return updated;
};

const showRoomType = async (id) => {
  const room = await getRoomLockState(prisma, id);
  if (!room) return null;

  if (isLockedByPartner(room)) {
    throw {
      statusCode: 400,
      message: 'Loại phòng đang bị đối tác khóa. Bạn không thể mở khóa.',
    };
  }
  if (room.trang_thai === 'hoat_dong') {
    return prisma.loai_phong.findUnique({ where: { ma_loai_phong: Number(id) } });
  }

  const moBan = Number(room.so_luong_mo_ban_truoc_khoa) > 0
    ? room.so_luong_mo_ban_truoc_khoa
    : (Number(room.so_luong_mo_ban) > 0 ? room.so_luong_mo_ban : room.so_luong_phong);

  const updated = await prisma.loai_phong.update({
    where: { ma_loai_phong: Number(id) },
    data: {
      trang_thai: 'hoat_dong',
      khoa_do_doi_tac: false,
      so_luong_mo_ban: moBan,
      so_luong_mo_ban_truoc_khoa: null,
    },
  });

  const context = await getRoomNotifyContext(id);
  if (context?.khach_san?.ma_doi_tac) {
    await notifyRoomTypeUnlocked(context.khach_san.ma_doi_tac, {
      tenLoaiPhong: context.ten_loai,
      tenKhachSan: context.khach_san.ten,
    });
  }

  return updated;
};

module.exports = {
  getRoomTypes,
  getRoomTypeById,
  getFilterLocations,
  getFilterPartners,
  getStats,
  hideRoomType,
  showRoomType,
};
