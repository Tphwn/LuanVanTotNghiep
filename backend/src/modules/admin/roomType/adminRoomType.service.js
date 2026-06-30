const prisma = require('../../../config/prisma');
const { attachRoomImages } = require('../../../utils/images');

const APPROVED_HOTEL_STATUSES = ['hoat_dong', 'da_duyet'];

const buildApprovedHotelWhere = (filters = {}) => {
  const hotelWhere = { trang_thai: { in: APPROVED_HOTEL_STATUSES } };
  if (filters.ma_dia_diem) hotelWhere.ma_dia_diem = Number(filters.ma_dia_diem);
  if (filters.ma_doi_tac) hotelWhere.ma_doi_tac = Number(filters.ma_doi_tac);
  return hotelWhere;
};

const buildRoomWhere = (filters = {}) => {
  const { trang_thai, keyword } = filters;
  const where = { khach_san: buildApprovedHotelWhere(filters) };

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

const computeInventory = (room) => {
  const tong = Number(room.so_luong_phong);
  const moBan = Number(room.so_luong_mo_ban ?? 0);
  if (room.trang_thai === 'an') {
    return { tong_so_phong: tong, dang_mo_ban: 0, dang_bao_tri: 0, dang_khoa: tong };
  }
  return {
    tong_so_phong: tong,
    dang_mo_ban: moBan,
    dang_bao_tri: Math.max(0, tong - moBan),
    dang_khoa: 0,
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
          doi_tac: { select: { ma_doi_tac: true, ten_cong_ty: true } },
        },
      },
    },
    orderBy: { ma_loai_phong: 'desc' },
  });

  return attachRoomImages(rooms);
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
    tinh_trang_phong: computeInventory(room),
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

const hideRoomType = async (id) => {
  const room = await prisma.loai_phong.findUnique({
    where: { ma_loai_phong: Number(id) },
  });
  if (!room) return null;
  if (room.trang_thai === 'an') return room;

  return prisma.loai_phong.update({
    where: { ma_loai_phong: Number(id) },
    data: { trang_thai: 'an', so_luong_mo_ban: 0 },
  });
};

const showRoomType = async (id) => {
  const room = await prisma.loai_phong.findUnique({
    where: { ma_loai_phong: Number(id) },
  });
  if (!room) return null;
  if (room.trang_thai === 'hoat_dong') return room;

  const moBan = room.so_luong_mo_ban > 0 ? room.so_luong_mo_ban : room.so_luong_phong;
  return prisma.loai_phong.update({
    where: { ma_loai_phong: Number(id) },
    data: { trang_thai: 'hoat_dong', so_luong_mo_ban: moBan },
  });
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
